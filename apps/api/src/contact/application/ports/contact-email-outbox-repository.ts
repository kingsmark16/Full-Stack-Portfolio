export const CONTACT_EMAIL_OUTBOX_REPOSITORY = Symbol(
  'CONTACT_EMAIL_OUTBOX_REPOSITORY',
)

export type ClaimedContactEmailOutbox = Readonly<{
  id: string
  deduplicationKey: string
  attemptCount: number
  leaseToken: string
  contact: Readonly<{
    name: string
    email: string
    message: string
    submittedAt: Date
  }>
}>

export type ClaimNextContactEmailOutboxInput = Readonly<{
  now: Date
  leaseToken: string
  leaseUntil: Date
}>

export type ContactEmailOutboxLeaseInput = Readonly<{
  id: string
  leaseToken: string
}>

export type RequeueContactEmailOutboxInput = ContactEmailOutboxLeaseInput &
  Readonly<{
    availableAt: Date
    lastError: string
  }>

export type MarkContactEmailOutboxDeliveredInput =
  ContactEmailOutboxLeaseInput &
    Readonly<{
      deliveredAt: Date
    }>

export type FailContactEmailOutboxInput = ContactEmailOutboxLeaseInput &
  Readonly<{
    failedAt: Date
    lastError: string
  }>

export interface ContactEmailOutboxRepository {
  recoverExpiredLeases(now: Date): Promise<number>
  claimNext(
    input: ClaimNextContactEmailOutboxInput,
  ): Promise<ClaimedContactEmailOutbox | null>
  markDelivered(input: MarkContactEmailOutboxDeliveredInput): Promise<boolean>
  requeueForRetry(input: RequeueContactEmailOutboxInput): Promise<boolean>
  markFailed(input: FailContactEmailOutboxInput): Promise<boolean>
}
