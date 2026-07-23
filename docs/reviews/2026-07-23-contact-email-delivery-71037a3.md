# Review, 71037a3, 2026-07-23

**Reviewed by**: GPT 5.6 Terra (author on GPT 5)
**Scope**: 23 files, `71037a3^..71037a3`
**Verdict**: Changes requested

## Summary

This change adds the outbox worker, Resend adapter, lease-token migration, worker command, and focused unit tests. The overall separation between application ports and Prisma/Resend infrastructure is sound, and the normal delivery/retry paths are clear. However, the explicit concurrent-idempotency retry requirement is implemented as a final failure, the provider timeout does not stop the underlying request, final failures are not logged, and the required lease/ambiguous-outcome paths lack integration coverage.

## Major

### 🟠 Concurrent idempotency failures are treated as final, `apps/api/src/contact/infrastructure/resend-email-gateway.ts:26`

**Problem**: `deliveryError` decides retryability solely from `statusCode`; every provider `4xx` apart from `429` is final. Resend exposes the explicitly named `concurrent_idempotent_requests` error, which the governing spec requires to retry, but it will commonly be a `409` and is therefore passed to `markFailed` on the first attempt.

**Why it matters**: A retry can overlap with an ambiguous prior submission that used the same idempotency key. The worker will permanently mark an otherwise deliverable owner notification as failed instead of waiting for the original request or retrying it.

**Suggested fix**: Preserve the provider error code/category in the adapter and classify Resend's concurrent-idempotency error as retryable in addition to network, timeout, `429`, and `5xx` failures. Add a gateway/worker test for that exact provider response.

### 🟠 The 45-second timeout leaves the Resend request running, `apps/api/src/contact/infrastructure/resend-email-gateway.ts:37`

**Problem**: `Promise.race` rejects the worker after 45 seconds but never aborts `this.resend.emails.send(...)`. The SDK call can still submit the email after the worker has requeued the row or after its 60-second lease has expired.

**Why it matters**: This violates the lease invariant that a worker cannot intentionally send after its lease expires. It can produce an ambiguous late send concurrent with a later claim; combined with the incorrect `409` handling above, the event can be recorded as final failure even though Resend accepts the original request.

**Suggested fix**: Make the provider operation genuinely abortable (for example, use an `AbortController` through an abort-capable client/fetch implementation) and abort it at the 45-second deadline, or otherwise redesign lease ownership so a request cannot outlive its lease. Exercise the late-response case in a test.

### 🟠 Final delivery failures are stored but never logged, `apps/api/src/contact/application/contact-email-outbox-worker.ts:105`

**Problem**: The final-failure branch calls `markFailed` and returns without emitting a log. The only worker log is the generic poll-level error in the process entry point, which is not reached for a successfully persisted final failure.

**Why it matters**: AC-5 requires final failures to be recorded and logged so the owner can discover and act on undelivered contact messages. In production these failures become silent rows in the database.

**Suggested fix**: Inject a logging boundary into the worker and, after a successful conditional final-state update, log the event identifier plus the sanitized provider category/status. Do not include the visitor message, addresses, API key, recipient, or raw provider response.

### 🟠 The required concurrency and ambiguous-outcome behavior is untested, `apps/api/src/contact/infrastructure/prisma-contact-email-outbox-repository.ts:29`

**Problem**: The configured Jest/API test suite adds only an in-memory repository whose `claimNext` ignores its input. There is no integration test of the raw `FOR UPDATE SKIP LOCKED` claim, expired-lease recovery, stale-token conditional updates, or a Resend acceptance followed by a failed database outcome and retry with the same key.

**Why it matters**: These are the central AC-3/AC-4 failure and race paths, and the fake tests cannot detect SQL/Prisma transaction behavior or a regression in ownership semantics. The governing spec lists all of them as critical scenarios.

**Suggested fix**: Add API/database integration coverage using the actual Prisma repository: concurrently claim a single queued row, recover and reclaim an expired lease while rejecting stale completion, and simulate a successful provider call with a failed delivery update to verify a later retry uses the stable idempotency key.

## Minor

### 🟡 The development worker is wired to live Resend configuration, `apps/api/src/contact/infrastructure/contact-email-worker.module.ts:29`

**Problem**: The module always loads all three production settings and always constructs `ResendEmailGateway`, including through `start:contact-email-worker:dev`. It has no non-production fake-gateway path despite the governing design stating that development and tests inject a fake gateway.

**Why it matters**: A developer cannot run the advertised development worker without production-like credentials, and supplying them makes a development command capable of sending real owner notifications.

**Suggested fix**: Make the module's provider selection environment-aware, inject a fake/non-delivering gateway outside production, and add a module-startup test confirming missing production settings fail while non-production avoids live provider calls.

## Strengths

- The application port keeps Resend and Prisma out of the worker's core delivery loop, preserving the intended architecture boundary.
- Claim, retry, delivery, and final-state updates consistently include both the outbox ID and lease token in the repository contract.
- The notification formatter has a focused test that verifies the required plain-text body shape and stable idempotency key.

## Test coverage

The new unit tests cover formatting, retry-delay calculations, required-value parsing, one successful send, the first retry delay, and the fifth retryable failure. They do not cover the Resend adapter's error classification or timeout behavior, actual PostgreSQL lease/concurrency behavior, stale ownership, the standalone worker lifecycle, non-production fake wiring, or the required ambiguous provider-success/database-failure retry path. The configured API test runner means these untested concurrency and error branches need coverage before merge.
