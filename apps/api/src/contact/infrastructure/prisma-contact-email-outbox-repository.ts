import { Injectable } from '@nestjs/common'
import {
  ContactEmailOutboxStatus,
  Prisma,
} from '../../../generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
  type ClaimedContactEmailOutbox,
  type ClaimNextContactEmailOutboxInput,
  type ContactEmailOutboxRepository,
  type FailContactEmailOutboxInput,
  type MarkContactEmailOutboxDeliveredInput,
  type RequeueContactEmailOutboxInput,
} from '../application/ports/contact-email-outbox-repository'

type ClaimedOutboxRow = Readonly<{
  id: string
  contactMessageId: string
  deduplicationKey: string
  attemptCount: number
  leaseToken: string
}>

@Injectable()
export class PrismaContactEmailOutboxRepository implements ContactEmailOutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recoverExpiredLeases(now: Date): Promise<number> {
    const result = await this.prisma.contactEmailOutbox.updateMany({
      where: {
        status: ContactEmailOutboxStatus.PROCESSING,
        leaseUntil: {
          lt: now,
        },
      },
      data: {
        status: ContactEmailOutboxStatus.QUEUED,
        availableAt: now,
        leaseToken: null,
        leaseUntil: null,
      },
    })

    return result.count
  }

  async claimNext(
    input: ClaimNextContactEmailOutboxInput,
  ): Promise<ClaimedContactEmailOutbox | null> {
    return this.prisma.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<ClaimedOutboxRow[]>(
        Prisma.sql`
          WITH next_outbox AS (
            SELECT "id"
            FROM "ContactEmailOutbox"
            WHERE "status" = 'queued'::"contact_email_outbox_status"
              AND "availableAt" <= ${input.now}
            ORDER BY "availableAt" ASC, "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          UPDATE "ContactEmailOutbox" AS outbox
          SET
            "status" = 'processing'::"contact_email_outbox_status",
            "attemptCount" = outbox."attemptCount" + 1,
            "leaseToken" = ${input.leaseToken},
            "leaseUntil" = ${input.leaseUntil},
            "lastError" = NULL
          FROM next_outbox
          WHERE outbox."id" = next_outbox."id"
          RETURNING
            outbox."id",
            outbox."contactMessageId",
            outbox."deduplicationKey",
            outbox."attemptCount",
            outbox."leaseToken"
        `,
      )

      const row = rows[0]

      if (!row) {
        return null
      }

      const contact = await transaction.contactMessage.findUnique({
        where: {
          id: row.contactMessageId,
        },
        select: {
          name: true,
          email: true,
          message: true,
          submittedAt: true,
        },
      })

      if (!contact) {
        throw new Error('Claimed contact outbox event has no contact message')
      }

      return {
        id: row.id,
        deduplicationKey: row.deduplicationKey,
        attemptCount: row.attemptCount,
        leaseToken: row.leaseToken,
        contact,
      }
    })
  }

  async markDelivered(
    input: MarkContactEmailOutboxDeliveredInput,
  ): Promise<boolean> {
    const result = await this.prisma.contactEmailOutbox.updateMany({
      where: {
        id: input.id,
        leaseToken: input.leaseToken,
        status: ContactEmailOutboxStatus.PROCESSING,
      },
      data: {
        status: ContactEmailOutboxStatus.DELIVERED,
        deliveredAt: input.deliveredAt,
        leaseToken: null,
        leaseUntil: null,
        lastError: null,
      },
    })

    return result.count === 1
  }

  async requeueForRetry(
    input: RequeueContactEmailOutboxInput,
  ): Promise<boolean> {
    const result = await this.prisma.contactEmailOutbox.updateMany({
      where: {
        id: input.id,
        leaseToken: input.leaseToken,
        status: ContactEmailOutboxStatus.PROCESSING,
      },
      data: {
        status: ContactEmailOutboxStatus.QUEUED,
        availableAt: input.availableAt,
        lastError: input.lastError,
        leaseToken: null,
        leaseUntil: null,
      },
    })

    return result.count === 1
  }

  async markFailed(input: FailContactEmailOutboxInput): Promise<boolean> {
    const result = await this.prisma.contactEmailOutbox.updateMany({
      where: {
        id: input.id,
        leaseToken: input.leaseToken,
        status: ContactEmailOutboxStatus.PROCESSING,
      },
      data: {
        status: ContactEmailOutboxStatus.FAILED,
        failedAt: input.failedAt,
        lastError: input.lastError,
        leaseToken: null,
        leaseUntil: null,
      },
    })

    return result.count === 1
  }
}
