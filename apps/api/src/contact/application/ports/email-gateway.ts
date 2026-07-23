export const EMAIL_GATEWAY = Symbol('EMAIL_GATEWAY')

export type OutboundEmail = Readonly<{
  from: string
  to: string
  replyTo: string
  subject: string
  text: string
  idempotencyKey: string
}>

export class EmailDeliveryError extends Error {
  constructor(
    public readonly retryable: boolean,
    public readonly summary: string,
    public readonly category = 'unknown',
    public readonly statusCode: number | null = null,
  ) {
    super(summary)
    this.name = 'EmailDeliveryError'
  }
}

export interface EmailGateway {
  send(email: OutboundEmail): Promise<void>
}
