import {
  CONTACT_EMAIL_LEASE_DURATION_MS,
  CONTACT_EMAIL_MAX_EVENTS_PER_POLL,
  retryDelayForAttempt,
} from '../domain/contact-email-delivery-policy'
import { buildContactNotificationEmail } from './contact-notification-email'
import {
  type ClaimedContactEmailOutbox,
  type ContactEmailOutboxRepository,
} from './ports/contact-email-outbox-repository'
import { EmailDeliveryError, type EmailGateway } from './ports/email-gateway'

export type ContactEmailOutboxWorkerDependencies = Readonly<{
  repository: ContactEmailOutboxRepository
  emailGateway: EmailGateway
  from: string
  to: string
  now: () => Date
  createLeaseToken: () => string
}>

function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds)
}

function errorSummary(error: unknown): string {
  if (error instanceof EmailDeliveryError) {
    return error.summary.slice(0, 200)
  }

  return 'Unexpected email delivery error'
}

function isRetryable(error: unknown): boolean {
  return !(error instanceof EmailDeliveryError) || error.retryable
}

export class ContactEmailOutboxWorker {
  constructor(
    private readonly dependencies: ContactEmailOutboxWorkerDependencies,
  ) {}

  async processAvailable(): Promise<number> {
    await this.dependencies.repository.recoverExpiredLeases(
      this.dependencies.now(),
    )

    let processedCount = 0

    while (processedCount < CONTACT_EMAIL_MAX_EVENTS_PER_POLL) {
      const now = this.dependencies.now()
      const leaseToken = this.dependencies.createLeaseToken()

      const outbox = await this.dependencies.repository.claimNext({
        now,
        leaseToken,
        leaseUntil: addMilliseconds(now, CONTACT_EMAIL_LEASE_DURATION_MS),
      })

      if (!outbox) {
        break
      }

      await this.processClaim(outbox)
      processedCount += 1
    }

    return processedCount
  }

  private async processClaim(outbox: ClaimedContactEmailOutbox): Promise<void> {
    try {
      await this.dependencies.emailGateway.send(
        buildContactNotificationEmail({
          deduplicationKey: outbox.deduplicationKey,
          name: outbox.contact.name,
          email: outbox.contact.email,
          message: outbox.contact.message,
          submittedAt: outbox.contact.submittedAt,
          from: this.dependencies.from,
          to: this.dependencies.to,
        }),
      )

      await this.dependencies.repository.markDelivered({
        id: outbox.id,
        leaseToken: outbox.leaseToken,
        deliveredAt: this.dependencies.now(),
      })
    } catch (error: unknown) {
      const retryDelay = isRetryable(error)
        ? retryDelayForAttempt(outbox.attemptCount)
        : null

      if (retryDelay !== null) {
        await this.dependencies.repository.requeueForRetry({
          id: outbox.id,
          leaseToken: outbox.leaseToken,
          availableAt: addMilliseconds(this.dependencies.now(), retryDelay),
          lastError: errorSummary(error),
        })
        return
      }

      await this.dependencies.repository.markFailed({
        id: outbox.id,
        leaseToken: outbox.leaseToken,
        failedAt: this.dependencies.now(),
        lastError: errorSummary(error),
      })
    }
  }
}
