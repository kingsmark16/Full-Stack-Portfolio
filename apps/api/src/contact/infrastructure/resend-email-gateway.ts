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
  name?: unknown
}>

function providerStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null
  }

  const { statusCode } = error as ProviderError
  return typeof statusCode === 'number' ? statusCode : null
}

function providerCategory(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return 'unknown'
  }

  const { name } = error as ProviderError

  if (typeof name !== 'string' || name.length === 0) {
    return 'unknown'
  }

  return name.replace(/[^a-z0-9_-]/gi, '_').slice(0, 80)
}

function deliveryError(error: unknown): EmailDeliveryError {
  const statusCode = providerStatusCode(error)
  const category = providerCategory(error)

  const retryable =
    category === 'concurrent_idempotent_requests' ||
    statusCode === null ||
    statusCode === 429 ||
    statusCode >= 500

  const summary =
    statusCode === null
      ? `Email provider request failed (${category})`
      : `Email provider request failed with status ${statusCode} (${category})`

  return new EmailDeliveryError(retryable, summary, category, statusCode)
}

type ResendSendOptions = NonNullable<
  Parameters<Resend['emails']['send']>[1]
> & {
  signal: AbortSignal
}

function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMilliseconds: number,
): Promise<T> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(
        new EmailDeliveryError(
          true,
          'Email provider request timed out',
          'timeout',
        ),
      )
    }, timeoutMilliseconds)
  })

  return Promise.race([operation(controller.signal), timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

@Injectable()
export class ResendEmailGateway implements EmailGateway {
  private readonly resend: Resend
  private readonly timeoutMilliseconds: number

  constructor(
    apiKey: string,
    timeoutMilliseconds = CONTACT_EMAIL_SEND_TIMEOUT_MS,
  ) {
    this.resend = new Resend(apiKey)
    this.timeoutMilliseconds = timeoutMilliseconds
  }

  async send(email: OutboundEmail): Promise<void> {
    try {
      const { error } = await withTimeout(
        (signal) =>
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
              signal,
            } as ResendSendOptions,
          ),
        this.timeoutMilliseconds,
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
