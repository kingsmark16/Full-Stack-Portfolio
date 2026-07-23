# Contact notification delivery

## Summary

Visitors already submit contact messages through the public form. The API saves each message and its outbox record together, but no process sends the queued email. Add a separate API worker that sends the owner a plain text Resend email, records delivery, and safely retries a temporary failure.

## Context

The existing public route returns `202 Accepted` after saving a private `ContactMessage` and one related `ContactEmailOutbox` row. This protects the visitor message from a temporary email provider outage, but the queued work is not yet processed.

The portfolio runs as one API application with PostgreSQL and Neon. The existing service integration decision already selects Resend and a PostgreSQL outbox. The contact API contract, validation, rate limit, honeypot, and idempotency key must remain unchanged.

## Requirements

**User stories**:

- As the portfolio owner, I want a valid visitor message delivered to my inbox so that I can reply promptly.
- As a visitor, I want a successful submission to stay accepted even when the email provider is temporarily unavailable.

**Acceptance criteria**:

- **AC-1**: A valid `POST /contact` request continues to return `202 Accepted`, creates one private message and one queued outbox event, and never sends email inline with the request.
- **AC-2**: The worker sends each queued event as one plain text email to `CONTACT_RECIPIENT_EMAIL`, from `EMAIL_FROM`, with the validated visitor email as Reply To, then records the event as delivered. Its fixed subject is `Portfolio contact message`; its body labels the saved name, email, UTC submission time, and message in that order.
- **AC-3**: A retryable delivery failure preserves the message, records a sanitized error, and retries with exponential delay until five attempted deliveries have failed. Network failures, timeouts, HTTP `429`, HTTP `5xx`, and Resend's concurrent-idempotency response are retryable; other provider `4xx` responses are final.
- **AC-4**: Concurrent worker processes cannot claim the same available event at the same time. Each claim has an ownership token, and a lost lease becomes available for a later retry without allowing its stale worker to update the event.
- **AC-5**: A final failure is recorded and logged without the visitor message body. The public visitor response remains unchanged.
- **AC-6**: Worker startup where `NODE_ENV=production` rejects missing email configuration. Tests use a fake email gateway and make no live email provider calls.

## Options considered

### Option 1: Send email in the request

The public controller would call the provider before returning `202 Accepted`.

**Pros**:

- Very little new code.

**Cons**:

- Provider latency and outages directly affect the visitor request.
- A request timeout can leave delivery uncertain.

### Option 2: Process the existing PostgreSQL outbox in a worker

A separate process claims queued rows, calls the provider, and records the result.

**Pros**:

- Preserves messages before delivery begins.
- Supports retries and safe concurrent workers without a second queue service.

**Cons**:

- Adds a worker command and deployment process.

### Option 3: Add Redis and a queue framework

A separate queue service would handle retries and worker scheduling.

**Pros**:

- Rich queue controls at high volume.

**Cons**:

- Adds infrastructure that this portfolio does not yet need.

## Decision

**Chosen option**: Option 2, process the existing PostgreSQL outbox in a separate NestJS worker with Resend.

The API keeps accepting contact messages quickly. The worker is the only process that holds Resend credentials and sends email. It passes the outbox deduplication key to the Resend SDK as `idempotencyKey`. Resend retains that key for 24 hours, which covers every defined retry delay.

## Rationale

The database model and service integration decision already provide the durable outbox needed for low volume contact notifications. A worker removes email latency from the visitor path and avoids introducing Redis or another service. Sending inline is simpler, but it makes a visitor message depend on a provider request that can fail after persistence.

## Feature design

**Data model sketch**:

- `ContactMessage` remains the private source record.
- `ContactEmailOutbox` remains a one to one delivery record with a unique `deduplicationKey`.
- Add nullable `leaseToken` to `ContactEmailOutbox` in a Prisma migration. It identifies the worker that currently owns a lease.
- The existing `status`, `attemptCount`, `availableAt`, `leaseUntil`, `lastError`, `deliveredAt`, and `failedAt` fields, together with `leaseToken`, cover the worker lifecycle.

**State transitions**:

- `queued` becomes `processing` when a worker leases an available event and writes a fresh `leaseToken`.
- `processing` becomes `delivered` after Resend accepts the email, only when the stored `leaseToken` still matches the worker's token.
- `processing` becomes `queued` with a later `availableAt` after a retryable failure, only when the token matches.
- `processing` becomes `failed` after the fifth failed attempt, only when the token matches.
- An expired `processing` lease becomes `queued` and clears its token before the next claim.

**API surface**:

| Surface    | Method          | Key inputs                                  | Key outputs                              | Auth        | Key errors                                         |
| ---------- | --------------- | ------------------------------------------- | ---------------------------------------- | ----------- | -------------------------------------------------- |
| `/contact` | POST            | Existing contact body and `Idempotency-Key` | Existing `202 Accepted` body             | Public      | Existing `422`, `429`, `500`                       |
| API worker | Process command | Queued outbox rows and server configuration | Delivered, queued retry, or failed state | Server only | Provider failure is recorded, not exposed publicly |

**Value sourcing**:

| Action              | Value                                        | Source                                                                        |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Create notification | Outbox event and stable deduplication key    | Existing transaction in `ContactService.submit`                               |
| Claim event         | Ready event, lease time, next attempt number | `ContactEmailOutbox` row and API clock                                        |
| Send email          | Recipient and sender                         | `CONTACT_RECIPIENT_EMAIL` and `EMAIL_FROM` environment values                 |
| Send email          | Reply To address                             | Validated `ContactMessage.email` column                                       |
| Send email          | Plain text content                           | Saved `ContactMessage.name`, `email`, `message`, and `submittedAt` columns    |
| Send email          | Subject                                      | Fixed `Portfolio contact message` value in the contact notification formatter |
| Retry delay         | Later `availableAt`                          | Attempt count and the defined exponential delay rule                          |
| Record outcome      | Delivery or failure fields                   | Resend result or sanitized provider error                                     |

**Key invariants**:

1. One idempotency key creates no more than one message and one outbox event.
2. The visitor request never invokes Resend directly.
3. A worker claims an event in one PostgreSQL transaction using `FOR UPDATE SKIP LOCKED`, writes a fresh UUID `leaseToken`, and leases it for 60 seconds.
4. Every delivered, retried, or failed update matches both the event ID and its `leaseToken`. A worker gives its Resend request a 45-second timeout, so it cannot intentionally send after its lease expires. The worker requeues expired leases and clears their tokens before claiming new work.
5. The worker increments `attemptCount` when it claims an event. Retry delays are 1, 5, 25, and 125 minutes. Network failures, timeouts, `429`, `5xx`, and Resend's concurrent-idempotency response retry; other provider `4xx` responses fail immediately. The fifth failed attempt records `failedAt` and does not schedule another retry.
6. The Resend request uses `deduplicationKey` as `idempotencyKey`. If Resend accepts an email but the database delivery update fails, a retry uses that same key. This removes duplicate sends inside Resend's 24-hour idempotency window, but the system remains at-least-once across a prolonged database outage.
7. Email subject text is always `Portfolio contact message`. The body is plain text in this exact shape: `Name: <name>`, `Email: <email>`, `Submitted: <UTC ISO timestamp>`, a blank line, `Message:`, then `<message>`. Visitor controlled text is rendered only as text in that body; the visitor email is also allowed in the validated Reply To field.
8. Logs and `lastError` contain only a provider status/category and the first 200 characters of a sanitized message. They never contain the visitor message body, API key, recipient email, or raw provider response.
9. The worker polls every 15 seconds, claims at most 10 rows per poll, sends one at a time, and stops claiming new rows on shutdown. It allows its in-flight send up to 30 seconds to finish; a remaining lease expires for a later worker.

**Security model**:

1. The public browser never receives Resend credentials or outbox status.
2. The owner recipient, sender address, and API key are server only configuration.
3. Contact messages and outbox data remain private. No new public read endpoint is added.
4. The existing rate limit, honeypot, body validation, trusted proxy rules, and idempotency protection remain in force.

**Configuration required**:

- `RESEND_API_KEY`: server only Resend credential.
- `EMAIL_FROM`: verified sender address used by Resend.
- `CONTACT_RECIPIENT_EMAIL`: owner inbox that receives the notification.

All three values are required when the worker starts with `NODE_ENV=production`; development and tests inject a fake email gateway instead.

**Critical test scenarios**:

- Happy path: one queued event is claimed, sent through a fake email gateway, and becomes delivered, verifies **AC-1** and **AC-2**.
- Failure case: a fake provider failure requeues the event with the expected delay, then marks it failed on attempt five, verifies **AC-3** and **AC-5**.
- Concurrency: two worker instances claim only one available event, and an expired lease becomes claimable again, verifies **AC-4**.
- Ambiguous outcome: provider acceptance followed by a failed database update retries with the same Resend idempotency key, verifies **AC-2**, **AC-3**, and the accepted at-least-once boundary.
- Configuration: production worker startup rejects missing email configuration, while tests inject a fake gateway, verifies **AC-6**.

## Build plan

1. Add contact notification application types, the email gateway port, and a fake gateway for tests, satisfies **AC-1**, **AC-2**, and **AC-6**.
2. Add the Resend gateway and configuration validation. Format the fixed subject and exact safe plain text body, and pass `deduplicationKey` as Resend's `idempotencyKey`, satisfies **AC-2**, **AC-5**, and **AC-6**.
3. Add the `leaseToken` migration and build the PostgreSQL outbox claim, lease recovery, conditional delivery update, retry, and final failure use cases, satisfies **AC-2**, **AC-3**, **AC-4**, and **AC-5**.
4. Add a standalone NestJS worker command that polls at the defined interval and shuts down gracefully. Deploy it separately from the HTTP API, satisfies **AC-1** through **AC-6**.
5. Add unit and API integration tests that use the fake gateway, including duplicate submissions, lease recovery, retry, and final failure, satisfies **AC-1** through **AC-6**.

## Consequences

**Positive**:

- Visitors receive a quick response while messages remain durable.
- Provider outages are recoverable without resubmission.
- Delivery work stays inside the API boundary.

**Negative and tradeoffs**:

- A worker process and Resend configuration must be deployed and monitored.
- An ambiguous provider timeout can require a retry. Resend idempotency prevents duplicate sends during its 24-hour key lifetime, but external delivery cannot be proven exactly once across a prolonged database outage.

**Neutral**:

- No new public route is required. The internal `leaseToken` migration is required.

## Follow up

- [ ] Add owner inbox views and message lifecycle controls after the owner authentication decision.
