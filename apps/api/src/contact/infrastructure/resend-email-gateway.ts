import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import {
  EmailDeliveryError,
  type EmailGateway,
  type OutboundEmail,
} from '../application/ports/email-gateway'
import { CONTACT_EMAIL_SEND_TIMEOUT_MS } from '../domain/contact-email-delivery-policy'

type ProviderError = Readonly<{
  statusCode?: unknown
}>

function providerStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null
  }

  const { statusCode } = error as ProviderError
  return typeof statusCode === 'number' ? statusCode : null
}

function deliveryError(error: unknown): EmailDeliveryError {
  const statusCode = providerStatusCode(error)

  const retryable =
    statusCode === null || statusCode === 429 || statusCode >= 500

  const summary =
    statusCode === null
      ? 'Email provider request failed'
      : `Email provider request failed with status ${statusCode}`

  return new EmailDeliveryError(retryable, summary)
}

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new EmailDeliveryError(true, 'Email provider request timed out'))
    }, CONTACT_EMAIL_SEND_TIMEOUT_MS)
  })

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

@Injectable()
export class ResendEmailGateway implements EmailGateway {
  private readonly resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async send(email: OutboundEmail): Promise<void> {
    try {
      const { error } = await withTimeout(
        this.resend.emails.send(
          {
            from: email.from,
            to: email.to,
            replyTo: email.replyTo,
            subject: email.subject,
            text: email.text,
          },
          {
            idempotencyKey: email.idempotencyKey,
          },
        ),
      )

      if (error) {
        throw deliveryError(error)
      }
    } catch (error: unknown) {
      if (error instanceof EmailDeliveryError) {
        throw error
      }

      throw deliveryError(error)
    }
  }
}
