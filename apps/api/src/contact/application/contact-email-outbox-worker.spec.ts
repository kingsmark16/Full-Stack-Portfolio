import { EmailDeliveryError } from './ports/email-gateway'
import { FakeEmailGateway } from './testing/fake-email-gateway'
import { ContactEmailOutboxWorker } from './contact-email-outbox-worker'
import {
  type ClaimedContactEmailOutbox,
  type ClaimNextContactEmailOutboxInput,
  type ContactEmailOutboxRepository,
  type FailContactEmailOutboxInput,
  type MarkContactEmailOutboxDeliveredInput,
  type RequeueContactEmailOutboxInput,
} from './ports/contact-email-outbox-repository'

class FakeContactEmailOutboxRepository implements ContactEmailOutboxRepository {
  readonly delivered: MarkContactEmailOutboxDeliveredInput[] = []
  readonly requeued: RequeueContactEmailOutboxInput[] = []
  readonly failed: FailContactEmailOutboxInput[] = []

  constructor(private nextOutbox: ClaimedContactEmailOutbox | null) {}

  recoverExpiredLeases(now: Date): Promise<number> {
    void now
    return Promise.resolve(0)
  }

  claimNext(
    input: ClaimNextContactEmailOutboxInput,
  ): Promise<ClaimedContactEmailOutbox | null> {
    void input
    const outbox = this.nextOutbox
    this.nextOutbox = null
    return Promise.resolve(outbox)
  }

  markDelivered(input: MarkContactEmailOutboxDeliveredInput): Promise<boolean> {
    this.delivered.push(input)
    return Promise.resolve(true)
  }

  requeueForRetry(input: RequeueContactEmailOutboxInput): Promise<boolean> {
    this.requeued.push(input)
    return Promise.resolve(true)
  }

  markFailed(input: FailContactEmailOutboxInput): Promise<boolean> {
    this.failed.push(input)
    return Promise.resolve(true)
  }
}

describe('ContactEmailOutboxWorker', () => {
  it('sends a claimed event and records delivery', async () => {
    const now = new Date('2026-07-23T02:00:00.000Z')
    const emailGateway = new FakeEmailGateway()
    const repository = new FakeContactEmailOutboxRepository({
      id: 'outbox-001',
      deduplicationKey: 'contact:submission-001',
      attemptCount: 1,
      leaseToken: 'lease-001',
      contact: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'I would like to discuss a project.',
        submittedAt: new Date('2026-07-23T01:02:03.000Z'),
      },
    })

    const worker = new ContactEmailOutboxWorker({
      repository,
      emailGateway,
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
      now: () => now,
      createLeaseToken: () => 'lease-001',
    })

    await expect(worker.processAvailable()).resolves.toBe(1)

    expect(emailGateway.sentEmails).toHaveLength(1)
    expect(emailGateway.sentEmails[0]).toMatchObject({
      to: 'owner@example.com',
      replyTo: 'ada@example.com',
      subject: 'Portfolio contact message',
      idempotencyKey: 'contact:submission-001',
    })
    expect(repository.delivered).toEqual([
      {
        id: 'outbox-001',
        leaseToken: 'lease-001',
        deliveredAt: now,
      },
    ])
    expect(repository.requeued).toEqual([])
    expect(repository.failed).toEqual([])
  })
  it('requeues a retryable delivery failure with the first delay', async () => {
    const now = new Date('2026-07-23T02:00:00.000Z')
    const emailGateway = new FakeEmailGateway()
    emailGateway.failure = new EmailDeliveryError(true, 'Request timed out')

    const repository = new FakeContactEmailOutboxRepository({
      id: 'outbox-002',
      deduplicationKey: 'contact:submission-002',
      attemptCount: 1,
      leaseToken: 'lease-002',
      contact: {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        message: 'Could we discuss an API project?',
        submittedAt: new Date('2026-07-23T01:30:00.000Z'),
      },
    })

    const worker = new ContactEmailOutboxWorker({
      repository,
      emailGateway,
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
      now: () => now,
      createLeaseToken: () => 'lease-002',
    })

    await expect(worker.processAvailable()).resolves.toBe(1)

    expect(repository.delivered).toEqual([])
    expect(repository.failed).toEqual([])
    expect(repository.requeued).toEqual([
      {
        id: 'outbox-002',
        leaseToken: 'lease-002',
        availableAt: new Date('2026-07-23T02:01:00.000Z'),
        lastError: 'Request timed out',
      },
    ])
  })
  it('marks the fifth retryable failure as final', async () => {
    const now = new Date('2026-07-23T02:00:00.000Z')
    const emailGateway = new FakeEmailGateway()
    emailGateway.failure = new EmailDeliveryError(
      true,
      'Email provider is unavailable',
    )

    const repository = new FakeContactEmailOutboxRepository({
      id: 'outbox-003',
      deduplicationKey: 'contact:submission-003',
      attemptCount: 5,
      leaseToken: 'lease-003',
      contact: {
        name: 'Katherine Johnson',
        email: 'katherine@example.com',
        message: 'I need help with a platform migration.',
        submittedAt: new Date('2026-07-23T01:45:00.000Z'),
      },
    })

    const worker = new ContactEmailOutboxWorker({
      repository,
      emailGateway,
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
      now: () => now,
      createLeaseToken: () => 'lease-003',
    })

    await expect(worker.processAvailable()).resolves.toBe(1)

    expect(repository.delivered).toEqual([])
    expect(repository.requeued).toEqual([])
    expect(repository.failed).toEqual([
      {
        id: 'outbox-003',
        leaseToken: 'lease-003',
        failedAt: now,
        lastError: 'Email provider is unavailable',
      },
    ])
  })
})
