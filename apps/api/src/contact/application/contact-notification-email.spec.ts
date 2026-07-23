import { buildContactNotificationEmail } from './contact-notification-email'

describe('buildContactNotificationEmail', () => {
  it('creates the fixed plain-text owner notification', () => {
    const email = buildContactNotificationEmail({
      deduplicationKey: 'contact:submission-001',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I would like to discuss a project.',
      submittedAt: new Date('2026-07-23T01:02:03.000Z'),
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
    })

    expect(email).toEqual({
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
      replyTo: 'ada@example.com',
      subject: 'Portfolio contact message',
      text: [
        'Name: Ada Lovelace',
        'Email: ada@example.com',
        'Submitted: 2026-07-23T01:02:03.000Z',
        '',
        'Message:',
        'I would like to discuss a project.',
      ].join('\n'),
      idempotencyKey: 'contact:submission-001',
    })
  })
})
