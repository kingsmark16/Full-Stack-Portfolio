# Contact form

## Summary

Visitors can send one message through the portfolio contact form. NestJS saves the message first, then queues email delivery to the owner. The visitor can reply through normal email without the message becoming public.

## Decision

Use a public `POST /contact` endpoint. It validates the visitor name, email, message, and honeypot field, accepts an `Idempotency-Key` request header, saves a ContactMessage, writes a ContactEmailOutbox notification in the same transaction, and returns `202 Accepted`.

## API surface

| Endpoint   | Method | Inputs                                                                | Outputs        | Auth   | Key errors                                                       |
| ---------- | ------ | --------------------------------------------------------------------- | -------------- | ------ | ---------------------------------------------------------------- |
| `/contact` | POST   | `name`, `email`, `message`, hidden honeypot, `Idempotency-Key` header | `202 Accepted` | public | `422` invalid input, `429` rate limit, `500` persistence failure |

## Value sourcing

| Action              | Value                        | Source                                     |
| ------------------- | ---------------------------- | ------------------------------------------ |
| Contact submission  | visitor name, email, message | validated POST body                        |
| Contact submission  | submitted time               | API clock at successful transaction commit |
| Email recipient     | owner Gmail address          | server only email configuration            |
| Email reply address | visitor email                | validated ContactMessage email field       |
| Inbox status        | `new`                        | ContactMessage default value               |

## Security and privacy

1. ContactMessage records are private to the authenticated owner.
2. Public callers cannot list, read, update, or delete messages.
3. Limit submissions to 5 per hour per IP.
4. A filled honeypot returns `202 Accepted` without saving or queueing a message.
5. Contact names allow 1 to 120 characters. Messages allow 1 to 5,000 characters. Request bodies are limited to 8 KB. Emails are trimmed and validated.
6. Send the exact saved message through Resend as plain text. Use `EMAIL_FROM` as the sender, `CONTACT_RECIPIENT_EMAIL` as the recipient, and the validated visitor email as Reply To. Do not place user controlled text in email headers except the validated Reply To address.
7. Require a unique idempotency key. A repeated key returns `202 Accepted` without creating another message or email.
8. Resolve client IP only through the validated `TRUST_PROXY_HOPS` setting. The first release uses local throttle storage for one API instance. A shared store is required before multiple API instances run.
9. Keep messages until the owner deletes them.
10. Logs and Problem Details responses must not include the message body.

## Failure behavior

1. If persistence fails, return a Problem Details error and do not queue email.
2. If email delivery fails after persistence, keep the ContactMessage and retry through the PostgreSQL outbox with exponential delay and five maximum attempts.
3. A worker claims one available event at a time with a lease and `FOR UPDATE SKIP LOCKED`. It records delivered or final failed state and reports final failure through Pino and Sentry.
4. Email failure does not change the visitor response after `202 Accepted`.

## Build notes

The owner dashboard endpoint for reading and changing message status depends on the separate owner authentication decision. The public contact form can be built now because it only creates private records.
