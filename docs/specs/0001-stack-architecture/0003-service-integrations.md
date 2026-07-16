# Service integrations

## Summary

Use managed object storage, transactional email, durable database backed retries, and small observability services. Keep each integration behind NestJS so browser code never holds provider credentials or bypasses business rules.

## Decision

**Chosen option**: Managed services behind the API

Use Cloudflare R2 for files, Resend for email, a PostgreSQL outbox for retryable work, Sentry for errors, and Pino for structured API logs. (basis: object storage, transactional outbox, and structured observability practices)

## File flow

- NestJS authorizes an upload and issues a short lived signed R2 operation.
- The browser sends bytes without receiving permanent provider credentials.
- NestJS validates the completed object before linking it to portfolio content.
- Public images and the current resume resolve from recorded object metadata, never from API disk.
- Upload size, type, image processing, replacement, and deletion rules belong to the Project and media content and Resume management specs.

## Email and background work

- Contact and recovery data commits before any dependent notification is considered complete.
- Retryable notification work is recorded in a PostgreSQL outbox in the same transaction as its source action.
- A separate Railway worker service runs from the same API image with a worker command and no HTTP listener.
- Workers claim jobs with PostgreSQL row locks using `FOR UPDATE SKIP LOCKED`, a lease expiry, and an idempotency key. Bounded retries end in a recorded final failure for monitoring.
- Redis and BullMQ remain deferred until measured volume or timing requirements exceed the database worker.
- Development, staging, and production use isolated Resend resources and credentials.

## Content freshness

- Successful public content changes request signed revalidation from NestJS to Next.js.
- The revalidation secret is not available to the browser.
- A short cache lifetime provides recovery if the request fails.
- A failed revalidation does not roll back a committed content change. It raises monitoring and the fallback eventually refreshes the page.

## Observability

- Sentry receives web and API exceptions with sensitive values removed.
- Pino writes structured API logs with a request identifier shared by Problem Details responses.
- Health checks distinguish process health from dependency readiness.
- An external check watches public availability and the API health surface.
- UptimeRobot is the external availability check for the first release.
- Logs never contain passwords, session secrets, cookies, recovery tokens, contact message bodies, or signed upload credentials.

## Consequences

- Provider outages become explicit partial failure cases.
- The outbox adds tables and worker behavior, but avoids a Redis service for low volume work.
- Direct browser uploads require completion checks and abandoned object cleanup.
- Signed revalidation needs a route that remains separate from the public NestJS `/api` routing rule.

## Rationale

The first release needs durable files and notifications, but not infrastructure ownership. Managed providers and a database outbox meet the expected volume with fewer operating parts. NestJS remains the integration boundary so provider changes do not spread through the Next.js application.
