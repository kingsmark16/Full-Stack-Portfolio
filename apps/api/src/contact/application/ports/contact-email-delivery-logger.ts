export const CONTACT_EMAIL_DELIVERY_LOGGER = Symbol(
  'CONTACT_EMAIL_DELIVERY_LOGGER',
)

export type ContactEmailDeliveryFailure = Readonly<{
  outboxId: string
  category: string
  statusCode: number | null
}>

export interface ContactEmailDeliveryLogger {
  finalFailure(failure: ContactEmailDeliveryFailure): void
}
