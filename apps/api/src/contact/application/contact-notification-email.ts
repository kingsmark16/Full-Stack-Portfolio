import { OutboundEmail } from './ports/email-gateway'

export type ContactNotificationEmailInput = Readonly<{
  deduplicationKey: string
  name: string
  email: string
  message: string
  submittedAt: Date
  from: string
  to: string
}>

export function buildContactNotificationEmail(
  input: ContactNotificationEmailInput,
): OutboundEmail {
  return {
    from: input.from,
    to: input.to,
    replyTo: input.email,
    subject: 'Portfolio contact message',
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Submitted: ${input.submittedAt.toISOString()}`,
      '',
      'Message:',
      input.message,
    ].join('\n'),
    idempotencyKey: input.deduplicationKey,
  }
}
