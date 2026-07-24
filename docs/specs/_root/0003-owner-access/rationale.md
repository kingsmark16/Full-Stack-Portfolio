# Owner access rationale

## Context

The portfolio needs one private dashboard owner. The earlier design included email verification, TOTP, recovery codes, password reset, custom session admission, account changes, audit storage, and several operator commands.

That design was much larger than the first dashboard needs. Owner access has not been implemented, so it can be reduced without migrating identity data.

The selected first release needs only one approved owner, password sign in, a secure session, sign out, and private API authorization. The owner accepts that there is no self service recovery in this version.

## Options considered

### Option 1: Password only Better Auth owner access

Better Auth owns passwords and sessions. The application adds one owner mapping and one authorization guard.

**Pros**:

- Small data model and API surface.
- Fastest path to a protected dashboard.
- No email provider dependency for authentication.

**Cons**:

- Password compromise gives direct dashboard access.
- Password loss can lock out the owner.

### Option 2: Password with email verification and TOTP

Require a verified email, password, and authenticator code.

**Pros**:

- Stronger protection when a password is exposed.
- Recovery codes reduce authenticator lockout risk.

**Cons**:

- More screens, states, tests, and support work.
- Requires recovery decisions before the dashboard is useful.

### Option 3: Password with email recovery

Use password sign in and Resend based password reset without TOTP.

**Pros**:

- Provides self service recovery.
- Smaller than full multifactor access.

**Cons**:

- Email delivery becomes part of owner access.
- Adds reset token and session revocation behavior.

## Rationale

Password only access matches the requested scope. Better Auth still handles password hashing, secure cookies, sessions, and rate limiting. The application only needs to prove that the authenticated user is the one approved owner.

The main cost is lockout and weaker protection if the password is stolen. Those tradeoffs are explicit. Recovery and stronger authentication can be designed later without changing the basic owner mapping.
