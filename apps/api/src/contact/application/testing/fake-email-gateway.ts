import {
  type EmailGateway,
  type OutboundEmail,
  EmailDeliveryError,
} from '../ports/email-gateway'

export class FakeEmailGateway implements EmailGateway {
  readonly sentEmails: OutboundEmail[] = []
  failure: EmailDeliveryError | null = null

  send(email: OutboundEmail): Promise<void> {
    if (this.failure) {
      return Promise.reject(this.failure)
    }

    this.sentEmails.push(email)
    return Promise.resolve()
  }
}
