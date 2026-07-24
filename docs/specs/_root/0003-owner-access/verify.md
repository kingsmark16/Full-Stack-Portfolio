# Owner access verification

Use an isolated test database. Do not run identity integration tests against the shared development database.

## Automated proof

1. Apply migrations to an empty database.
2. Run NestJS with the Better Auth mount.
3. Prove normal JSON DTO validation still works after the body parser change.
4. Run API tests for bootstrap, sign in, access context, sign out, authorization, and rate limiting.
5. Run browser tests for the sign in and dashboard screens.
6. Run accessibility checks and a production build.

## Required failure proof

- Two bootstrap commands run together and only the approved owner mapping remains.
- A Better Auth user exists after an interrupted bootstrap and the next run creates the mapping.
- An interrupted Better Auth user with a different password is rejected and is not adopted.
- Bootstrap is rejected when `OWNER_OPERATIONS_ENABLED` is not true.
- The database rejects an `OwnerAccess` row whose `singletonKey` is not `1`.
- Invalid credentials return the same error.
- An authenticated user whose ID does not match `OwnerAccess.userId` receives 403.
- Sign out invalidates the current session.
- Missing and untrusted origins are rejected for state changes.
- The configured trusted proxy depth produces the expected client IP and spoofed forwarding headers do not bypass the sign in limit.
- Session refresh happens no more than once per 24 hours and moves the persisted expiry to seven days from the accepted refresh.
- An identity database failure returns 503 for private access while the public portfolio still loads.
- Logs contain request context but no passwords, session tokens, or cookie values.
- Verification, TOTP, recovery code, recovery, reset, sign up, admin, social, and account linking routes are unavailable to the browser.

## Manual confirmation

1. Run bootstrap with a hidden password.
2. Sign in with the approved email and password.
3. Open `/dashboard`.
4. Sign out and confirm dashboard data is unavailable.
5. Try an incorrect password and confirm the error does not reveal extra account information.
6. Confirm the sign in page works on mobile and with keyboard navigation.

## Acceptance mapping

| Acceptance criterion | Primary proof                                                     |
| -------------------- | ----------------------------------------------------------------- |
| AC 1                 | Bootstrap, unique constraint, and concurrency tests               |
| AC 2                 | Sign in success and generic failure tests                         |
| AC 3                 | Cookie, expiry, and sign out tests                                |
| AC 4                 | Guard, owner mapping, Problem Details, and outage isolation tests |
| AC 5                 | Accessibility, responsive layout, log safety, and metadata checks |
| AC 6                 | Full NestJS, Prisma, Better Auth, and Next.js integration suite   |
