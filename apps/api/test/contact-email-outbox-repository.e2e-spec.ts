import { randomUUID } from 'node:crypto'
import { PrismaService } from '../src/prisma/prisma.service'
import { ContactEmailOutboxWorker } from '../src/contact/application/contact-email-outbox-worker'
import { FakeEmailGateway } from '../src/contact/application/testing/fake-email-gateway'
import { type ContactEmailDeliveryLogger } from '../src/contact/application/ports/contact-email-delivery-logger'
import { ContactEmailOutboxStatus } from '../generated/prisma/client'
import { PrismaContactEmailOutboxRepository } from '../src/contact/infrastructure/prisma-contact-email-outbox-repository'
import {
  type ClaimedContactEmailOutbox,
  type ClaimNextContactEmailOutboxInput,
  type ContactEmailOutboxRepository,
  type FailContactEmailOutboxInput,
  type MarkContactEmailOutboxDeliveredInput,
  type RequeueContactEmailOutboxInput,
} from '../src/contact/application/ports/contact-email-outbox-repository'

jest.setTimeout(30_000)

class NoopContactEmailDeliveryLogger implements ContactEmailDeliveryLogger {
  finalFailure(): void {
    return
  }
}

class FailFirstDeliveryUpdateRepository implements ContactEmailOutboxRepository {
  private shouldFailDeliveryUpdate = true

  constructor(private readonly delegate: ContactEmailOutboxRepository) {}

  recoverExpiredLeases(now: Date): Promise<number> {
    return this.delegate.recoverExpiredLeases(now)
  }

  claimNext(
    input: ClaimNextContactEmailOutboxInput,
  ): Promise<ClaimedContactEmailOutbox | null> {
    return this.delegate.claimNext(input)
  }

  markDelivered(input: MarkContactEmailOutboxDeliveredInput): Promise<boolean> {
    if (this.shouldFailDeliveryUpdate) {
      this.shouldFailDeliveryUpdate = false
      return Promise.resolve(false)
    }

    return this.delegate.markDelivered(input)
  }

  requeueForRetry(input: RequeueContactEmailOutboxInput): Promise<boolean> {
    return this.delegate.requeueForRetry(input)
  }

  markFailed(input: FailContactEmailOutboxInput): Promise<boolean> {
    return this.delegate.markFailed(input)
  }
}

describe('PrismaContactEmailOutboxRepository (e2e)', () => {
  let prisma: PrismaService
  let repository: PrismaContactEmailOutboxRepository
  const createdKeys: string[] = []
  let displacedQueuedRows: Array<{ id: string; availableAt: Date }> = []
  let displacedProcessingRows: Array<{ id: string; leaseUntil: Date | null }> =
    []

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
    repository = new PrismaContactEmailOutboxRepository(prisma)
  })

  beforeEach(async () => {
    displacedQueuedRows = await prisma.contactEmailOutbox.findMany({
      where: { status: ContactEmailOutboxStatus.QUEUED },
      select: { id: true, availableAt: true },
    })

    if (displacedQueuedRows.length > 0) {
      await prisma.contactEmailOutbox.updateMany({
        where: {
          id: { in: displacedQueuedRows.map((row) => row.id) },
          status: ContactEmailOutboxStatus.QUEUED,
        },
        data: { availableAt: new Date('2999-01-01T00:00:00.000Z') },
      })
    }

    displacedProcessingRows = await prisma.contactEmailOutbox.findMany({
      where: { status: ContactEmailOutboxStatus.PROCESSING },
      select: { id: true, leaseUntil: true },
    })

    if (displacedProcessingRows.length > 0) {
      await prisma.contactEmailOutbox.updateMany({
        where: {
          id: { in: displacedProcessingRows.map((row) => row.id) },
          status: ContactEmailOutboxStatus.PROCESSING,
        },
        data: { leaseUntil: new Date('2999-01-01T00:00:00.000Z') },
      })
    }
  })

  afterEach(async () => {
    if (createdKeys.length > 0) {
      await prisma.contactMessage.deleteMany({
        where: { idempotencyKey: { in: createdKeys } },
      })
      createdKeys.length = 0
    }

    for (const row of displacedQueuedRows) {
      await prisma.contactEmailOutbox.updateMany({
        where: {
          id: row.id,
          status: ContactEmailOutboxStatus.QUEUED,
        },
        data: { availableAt: row.availableAt },
      })
    }
    displacedQueuedRows = []

    for (const row of displacedProcessingRows) {
      await prisma.contactEmailOutbox.updateMany({
        where: {
          id: row.id,
          status: ContactEmailOutboxStatus.PROCESSING,
        },
        data: { leaseUntil: row.leaseUntil },
      })
    }
    displacedProcessingRows = []
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function createQueuedEvent(
    suffix: string,
    availableAt = new Date(Date.now() - 1_000),
  ): Promise<string> {
    const idempotencyKey = `review-repository-${suffix}-${randomUUID()}`
    createdKeys.push(idempotencyKey)

    await prisma.contactMessage.create({
      data: {
        idempotencyKey,
        name: 'Repository review visitor',
        email: 'visitor@example.com',
        message: 'Repository integration test message.',
        emailOutbox: {
          create: {
            deduplicationKey: `contact:${idempotencyKey}`,
            availableAt,
          },
        },
      },
    })

    return idempotencyKey
  }

  it('does not claim the same row when two workers race', async () => {
    await createQueuedEvent('concurrent')
    const now = new Date()

    const [first, second] = await Promise.all([
      repository.claimNext({
        now,
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + 60_000),
      }),
      repository.claimNext({
        now,
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + 60_000),
      }),
    ])

    const claimed = [first, second].filter(
      (row): row is ClaimedContactEmailOutbox => row !== null,
    )

    expect(claimed).toHaveLength(1)
    expect(new Set(claimed.map((row) => row.id)).size).toBe(claimed.length)
    expect(claimed.every((row) => row.attemptCount === 1)).toBe(true)
  })

  it('recovers an expired lease and rejects stale completion', async () => {
    const idempotencyKey = await createQueuedEvent('lease')
    const now = new Date()
    const stale = await repository.claimNext({
      now,
      leaseToken: 'stale-lease-token',
      leaseUntil: new Date(now.getTime() + 60_000),
    })

    if (!stale) {
      throw new Error('Expected the test event to be claimed')
    }

    await prisma.contactEmailOutbox.update({
      where: { deduplicationKey: `contact:${idempotencyKey}` },
      data: { leaseUntil: new Date(now.getTime() - 1_000) },
    })
    await expect(repository.recoverExpiredLeases(now)).resolves.toBe(1)

    const fresh = await repository.claimNext({
      now,
      leaseToken: 'fresh-lease-token',
      leaseUntil: new Date(now.getTime() + 60_000),
    })

    expect(fresh?.leaseToken).toBe('fresh-lease-token')
    await expect(
      repository.markDelivered({
        id: stale.id,
        leaseToken: stale.leaseToken,
        deliveredAt: now,
      }),
    ).resolves.toBe(false)
  })

  it('retries an ambiguous provider success with the stable idempotency key', async () => {
    const idempotencyKey = await createQueuedEvent('ambiguous')
    const ambiguousKey = `contact:${idempotencyKey}`
    const gateway = new FakeEmailGateway()
    const retryingRepository = new FailFirstDeliveryUpdateRepository(repository)
    const now = new Date()
    const worker = new ContactEmailOutboxWorker({
      repository: retryingRepository,
      emailGateway: gateway,
      logger: new NoopContactEmailDeliveryLogger(),
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
      now: () => now,
      createLeaseToken: randomUUID,
    })

    await expect(worker.processAvailable()).resolves.toBe(1)

    const inFlight = await prisma.contactEmailOutbox.findMany({
      where: {
        deduplicationKey: ambiguousKey,
        status: ContactEmailOutboxStatus.PROCESSING,
      },
      select: { deduplicationKey: true },
    })

    expect(inFlight).toHaveLength(1)

    await prisma.contactEmailOutbox.updateMany({
      where: {
        deduplicationKey: ambiguousKey,
        status: ContactEmailOutboxStatus.PROCESSING,
      },
      data: { leaseUntil: new Date(now.getTime() - 1_000) },
    })

    await expect(worker.processAvailable()).resolves.toBe(1)
    const ambiguousDeliveries = gateway.sentEmails.filter(
      (email) => email.idempotencyKey === ambiguousKey,
    )

    expect(ambiguousDeliveries).toHaveLength(2)
  })
})
