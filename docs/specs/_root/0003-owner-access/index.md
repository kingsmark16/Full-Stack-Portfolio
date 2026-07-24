# 0003. Owner access

**Date**: 2026-07-24
**Status**: In Progress

## Summary

One approved owner signs in with email and password to open the dashboard. Better Auth owns password storage and secure browser sessions inside NestJS. The application adds only one owner record and one private route guard.

## Requirements

**User stories**:

- As the owner, I want a simple sign in and sign out flow so that I can manage the portfolio.
- As a visitor, I want dashboard data to remain private while the public portfolio stays available.
- As the operator, I want one protected setup command so that visitors cannot register as owners.

**Acceptance criteria**:

- **AC 1**: A protected command creates or resumes the one approved owner. Public registration does not exist. A second owner is rejected.
- **AC 2**: The approved owner can sign in with the configured email and password. Invalid credentials always return the same public error.
- **AC 3**: The session uses a secure HTTP only cookie, expires after seven days, refreshes at most once per day, and becomes unusable after sign out.
- **AC 4**: A private API request succeeds only when the Better Auth user ID matches `OwnerAccess.userId`. Missing authentication returns 401, a different authenticated user returns 403, rate limiting returns 429, and identity storage failure returns 503 through the existing Problem Details format.
- **AC 5**: The sign in screen is accessible, responsive, uses the Neon Toxic design system, clears the password after failure, does not appear in search results, and never exposes credentials or session tokens in logs or errors.
- **AC 6**: Integration tests prove the Better Auth NestJS mount, request body handling, public and private route guards, cookie behavior, sign in, sign out, owner authorization, rate limiting, and coexistence of Better Auth and application migrations.

## Decision

**Chosen option**: Password only Better Auth owner access

Pin `better-auth` at `1.6.24`, `@better-auth/prisma-adapter` at `1.6.24`, and `@thallesp/nestjs-better-auth` at `2.7.0`. Mount Better Auth under `/api/auth` in NestJS. Enable email and password sign in and database stored sessions. Do not enable email verification, TOTP, recovery codes, password recovery, social sign in, or public registration.

The application owns one `OwnerAccess` row. Every private dashboard request checks that the current Better Auth user ID matches this row.

## Feature design

### Access lifecycle

```text
No owner
  to protected bootstrap
  to owner ready

Owner ready
  to password sign in
  to dashboard
  to sign out
  to password sign in
```

There is no self service password recovery. Losing the password means the owner cannot sign in until a later protected operator recovery feature is built.

### Data model

Better Auth owns its generated Prisma models for users, password accounts, sessions, and rate limits.

The application adds only this model:

| Entity        | Fields                                                                          | Rules                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `OwnerAccess` | `singletonKey Int`, `userId String`, `createdAt DateTime`, `updatedAt DateTime` | `singletonKey` is the primary key. A database check requires `singletonKey = 1`. `userId` is unique and references the Better Auth user. |

Prisma remains the only migration authority. Better Auth migration commands do not run against shared or production databases.

### Bootstrap

The `owner:bootstrap` command reads `OWNER_BOOTSTRAP_EMAIL`. It obtains the password from `OWNER_BOOTSTRAP_PASSWORD` or an interactive hidden prompt.

The password must have 12 to 128 characters. It must contain an uppercase letter, a lowercase letter, a number, and a symbol.

The command follows these rules:

- If `OwnerAccess` already points to the approved email, it reports success and changes nothing.
- If `OwnerAccess` points to another user, it exits with a conflict.
- If the exact Better Auth user exists and the owner mapping does not, the command verifies the supplied password through the Better Auth password verifier. It creates the mapping only when the password matches. A mismatch is a conflict and never changes the password.
- Otherwise it creates the Better Auth user through the server only admin API, then creates the owner mapping.
- Database unique constraints allow only one owner mapping.
- Concurrent commands reload the final state. A losing command reports success only when the final owner matches the approved email.
- Passwords never appear in command arguments, output, or logs.
- The command requires `OWNER_OPERATIONS_ENABLED=true`. It runs only from the production deployment console or a one time job identity that can read the owner secrets and connect to the database. An interactive run requires a TTY when no password secret is present.

### Better Auth configuration

Enable email and password authentication, database stored sessions, database stored rate limits, and the server only admin plugin used by bootstrap.

Use these fixed values:

| Setting                 | Value                                               |
| ----------------------- | --------------------------------------------------- |
| Public sign up          | Disabled                                            |
| Email verification      | Disabled                                            |
| Session lifetime        | Rolling seven days from the latest accepted refresh |
| Session refresh         | At most once every 24 hours                         |
| Minimum password length | 12 characters                                       |
| Maximum password length | 128 characters                                      |
| Sign in IP limit        | Ten requests in 15 minutes                          |
| Cookie cache            | Disabled                                            |

Use `@thallesp/nestjs-better-auth` with NestJS body parsing disabled at application creation and restored by its auth module. Preserve the current JSON body limit and DTO validation for normal API routes.

Expose only sign in, session, and sign out routes required by the browser. Block public sign up, admin routes, email verification, password recovery, password reset, social sign in, anonymous access, account linking, email change, TOTP, recovery codes, and every other unlisted Better Auth route.

### API surface

| Endpoint or command       | Method  | Purpose                                         | Access               | Main errors                              |
| ------------------------- | ------- | ----------------------------------------------- | -------------------- | ---------------------------------------- |
| `/api/auth/sign-in/email` | POST    | Start the owner session                         | Public, rate limited | 401, 429, 503                            |
| `/api/auth/get-session`   | GET     | Read the current session                        | Session cookie       | 401, 503                                 |
| `/api/auth/sign-out`      | POST    | Revoke the current session and clear its cookie | Owner session        | 503                                      |
| `/owner/access-context`   | GET     | Return whether the current user is the owner    | Owner session        | 401, 403, 503                            |
| `owner:bootstrap`         | Command | Create or resume the approved owner             | Protected operator   | Invalid input, conflict, storage failure |

All owner and auth responses use `Cache-Control: no-store`. Access pages and responses use `X-Robots-Tag: noindex, nofollow`.

### Value sourcing

| Action         | Value produced or displayed | Source                                                                                                                                 |
| -------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap      | Approved email              | Exact `OWNER_BOOTSTRAP_EMAIL` environment value, trimmed and lowercased                                                                |
| Bootstrap      | Password                    | `OWNER_BOOTSTRAP_PASSWORD` protected secret or hidden prompt                                                                           |
| Bootstrap      | Owner mapping               | Better Auth user ID returned by server only user creation or exact email lookup                                                        |
| Sign in        | Email                       | Trimmed and lowercased form input                                                                                                      |
| Sign in        | Password                    | Exact form input, never trimmed                                                                                                        |
| Sign in        | Invalid result              | Fixed text, `We could not sign you in with those details.`                                                                             |
| Sign in        | Success route               | Fixed `/dashboard` route                                                                                                               |
| Access context | Owner result                | Equality between the current Better Auth user ID and `OwnerAccess.userId`                                                              |
| Error response | Request ID                  | Existing NestJS request context                                                                                                        |
| Session        | Expiry                      | Persisted Better Auth session `expiresAt`, initially seven days from creation and moved to seven days from each accepted daily refresh |
| Session        | Cookie                      | Better Auth session token using the fixed cookie settings below                                                                        |

### Authorization and security

NestJS stays private by default. Public portfolio reads, contact submission, and the sign in route are explicitly public.

`OwnerAccessGuard` performs these checks:

1. A valid Better Auth session exists.
2. Its user ID equals `OwnerAccess.userId`.

The web application reads access context only to choose a screen. The API guard remains the security boundary.

Use one host only cookie named `mcanghel.session_token`. In production it uses `Secure`, `HttpOnly`, `SameSite=Lax`, and path `/`. Local HTTP may omit `Secure` only outside production.

State changing browser requests require an `Origin` that exactly matches one value in `AUTH_TRUSTED_ORIGINS`.

Sign in rate limiting uses Express `request.ip` after the existing trusted proxy configuration resolves it. `TRUST_PROXY_HOPS` remains required in production. Forwarded headers are ignored beyond that configured proxy depth.

Structured NestJS logs record the request ID, event name, outcome, and owner user ID when known. They never contain email and password pairs, passwords, session tokens, cookie values, or provider error bodies.

### Configuration required

- `BETTER_AUTH_SECRET`: Better Auth signing and encryption secret.
- `BETTER_AUTH_URL`: Canonical public API origin.
- `AUTH_TRUSTED_ORIGINS`: Exact allowed browser origins.
- `OWNER_BOOTSTRAP_EMAIL`: The one approved owner email.
- `OWNER_BOOTSTRAP_PASSWORD`: Optional protected bootstrap secret.
- `OWNER_OPERATIONS_ENABLED`: Explicit `true` gate for the bootstrap command. It defaults to false.

Production startup fails when a required value is missing, the public URL is not HTTPS, or the Better Auth secret is shorter than 32 random bytes.

### User interface

| Route                | Purpose                      |
| -------------------- | ---------------------------- |
| `/dashboard/sign-in` | Email and password sign in   |
| `/dashboard`         | Protected owner landing page |

The sign in form has visible labels, keyboard support, visible focus, `autocomplete="username"` and `autocomplete="current-password"`, status announcements, and WCAG AA contrast. An unexpected error keeps the email field, clears the password, shows a generic message, and includes the request ID.

### Critical test scenarios

- Bootstrap creates one owner, safely resumes, and rejects another owner, verifies **AC 1**.
- Correct credentials reach the dashboard and invalid credentials show one generic result, verifies **AC 2**.
- The secure cookie opens a session, expires as configured, and stops working after sign out, verifies **AC 3**.
- Missing, foreign, and database failure states return the approved errors without private data, verifies **AC 4**.
- Keyboard, responsive layout, failure handling, log safety, and search exclusion work on the sign in screen, verifies **AC 5**.
- A NestJS integration suite proves body parsing, guards, auth routes, rate limiting, and migrations, verifies **AC 6**.

## Build plan

The project uses a Journey build approach. Each task completes one usable part of the owner path.

1. Add pinned Better Auth packages, generated Prisma models, `OwnerAccess`, unique constraints, and one reviewed migration. Add migration and bootstrap tests. Satisfies **AC 1** and **AC 6**.
2. Mount Better Auth in NestJS. Add validated configuration, approved routes, secure cookies, trusted origin checks, rate limiting, structured logs, and `OwnerAccessGuard`. Prove normal DTO validation still works. Satisfies **AC 3**, **AC 4**, **AC 5**, and **AC 6**.
3. Build the protected bootstrap command, sign in, access context, sign out, and the two accessible dashboard screens. Satisfies **AC 1**, **AC 2**, **AC 3**, **AC 4**, and **AC 5**.
4. Complete API and browser integration proof, production configuration checks, and public portfolio outage isolation. Satisfies **AC 4**, **AC 5**, and **AC 6**.

## Consequences

**Positive**:

- The feature has one application model, one guard, and two screens.
- Better Auth owns password hashing and sessions.
- The first dashboard can be built sooner.

**Negative and tradeoffs**:

- The account has no second authentication factor.
- There is no email verification or password recovery.
- Losing the password locks the owner out until a separate operator recovery feature is built.
- Anyone who obtains the password can access the dashboard until the password or session data is changed through an operator procedure.
- There is no session management page or durable security audit history.

**Neutral**:

- Advanced security controls remain possible later.
- Resend is not required for owner access.

## Rationale

See [rationale.md](rationale.md).

## Follow-up

- [ ] Add a protected operator password recovery feature before production if permanent lockout is not acceptable.
- [ ] Add TOTP only if the owner later wants stronger account protection.
- [ ] Add session management or durable audit storage only when there is a clear operational need.
