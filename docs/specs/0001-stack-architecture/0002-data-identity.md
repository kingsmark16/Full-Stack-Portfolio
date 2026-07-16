# Data and identity

## Summary

NestJS is the only owner of PostgreSQL, Prisma, authentication, and authorization. Neon supplies managed PostgreSQL. Better Auth supplies identity, but its NestJS adapter must pass a focused integration proof before the architecture is treated as runnable.

## Decision

**Chosen option**: Managed PostgreSQL with API owned identity

Use PostgreSQL on Neon, Prisma with the Neon adapter, and Better Auth mounted in NestJS Express. Browser sessions use secure HTTP only cookies through the same origin API route. (basis: official Prisma Neon and Better Auth NestJS guidance)

## Persistence boundary

- `apps/api` owns the Prisma schema, migrations, generated client, repositories, transactions, and reviewed raw SQL.
- Runtime traffic uses a pooled Neon connection and the Neon Prisma adapter.
- Migration commands use a separate direct connection.
- Better Auth uses its Prisma adapter and stores its tables in the same `apps/api` Prisma schema as application data.
- The Better Auth generator may produce model definitions for review, but Prisma is the sole migration authority. Better Auth migration commands never run against shared or production databases.
- `prisma migrate deploy` runs once in the release pipeline, never during normal application startup.
- Normal content work uses Prisma. Reporting or complex queries may use parameterized SQL after review.
- Neon scale to zero latency is an accepted cost for low traffic environments and must be included in timeout and health behavior.

## Identity boundary

- One owner identity can access `/dashboard` and private API resources.
- Better Auth is mounted under `/api/auth` through NestJS.
- The NestJS global authorization posture is private by default. Public portfolio reads and contact submission are explicit public routes.
- Sessions use secure, HTTP only, same site cookies under the public origin.
- Account recovery uses Resend and never exposes whether an arbitrary address belongs to the owner.
- Session, CSRF, cookie, password, recovery, and audit rules are completed in the Owner access feature spec.

## Validation boundary

- Zod validates environment configuration and Next.js forms.
- NestJS DTOs use its standard validation pipeline and populate OpenAPI.
- Generated API client types come from OpenAPI, not duplicated Zod schemas.
- Prisma input types never cross the API boundary.

## Integration proof gate

The stack scaffold is not complete until one proof verifies all of these behaviors:

- Better Auth operates with NestJS body parser requirements.
- A normal JSON API route still reaches NestJS DTO validation.
- Public and protected route annotations work with the global guard.
- Sign in sets the intended cookie through the same origin `/api` path.
- A protected request succeeds with the cookie and fails without it.
- CSRF and origin checks reject an invalid state changing request.
- Recovery email can be requested without identity disclosure.
- Auth and application schema migrations coexist under one release policy.
- The generated Better Auth models are present in Prisma and a Prisma migration creates them.

## Consequences

- Better Auth adapter changes can affect global NestJS request handling.
- Authentication failure blocks feature work until the proof passes or a new identity decision supersedes this child.
- Keeping Zod out of NestJS DTO validation means frontend schemas and server DTOs are separate, while OpenAPI carries the contract between them.
- Direct database access from Next.js is forbidden even when it appears faster for a public page.

## Rationale

PostgreSQL fits the relational portfolio and contact domain. Prisma keeps normal data work productive, while the separate migration connection respects Neon's managed connection model. Better Auth avoids custom identity code, but the proof gate acknowledges that its NestJS adapter has more integration risk than the other chosen libraries.
