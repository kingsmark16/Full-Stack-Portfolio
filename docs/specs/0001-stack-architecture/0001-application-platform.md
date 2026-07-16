# Application platform

## Summary

Use one Next.js application and one NestJS API inside a pnpm monorepo. Keep public rendering on the server and dashboard interaction in the client only where it adds value. Share generated contracts and interface foundations, not business logic.

## Decision

**Chosen option**: One web application and one modular API

Use the current stable Next.js App Router and NestJS releases supported by Node.js 24 LTS. pnpm manages workspaces and Turborepo coordinates tasks and caching. (basis: official Node.js, Next.js, pnpm, and NestJS guidance)

## Repository shape

```text
apps/
  web/
  api/
packages/
  api-client/
  ui/
  config/
```

| Area                  | Decision                                                                    |
| --------------------- | --------------------------------------------------------------------------- |
| `apps/web`            | One Next.js application for public routes and protected `/dashboard` routes |
| `apps/api`            | One NestJS Express application with internal domain modules                 |
| `packages/api-client` | Generated TypeScript client from NestJS OpenAPI                             |
| `packages/ui`         | Accessible project owned components shared inside the web application       |
| `packages/config`     | Shared TypeScript and repository tool configuration                         |

## Rendering and state

- Public portfolio pages use Server Components and server fetches to NestJS.
- Public content uses tagged caching where useful, signed revalidation after mutations, and a short lifetime fallback.
- Dashboard queries and mutations use TanStack Query.
- Zustand is optional until interface state truly spans components. It never duplicates API data.
- React Hook Form and Zod provide client feedback. NestJS remains the final validation authority.

## API contract

- Vercel rewrites browser routes under `/api/:path*` to the Railway API origin.
- Server Components use the server only `API_INTERNAL_URL` to call Railway directly. Browser code uses `NEXT_PUBLIC_API_BASE_PATH=/api`.
- Resource endpoints use REST and publish OpenAPI.
- Orval generates a plain `fetch` client for server and general use, plus TanStack Query helpers for dashboard resources.
- Browser calls use `credentials: include`. Public server calls need no credentials. Any authenticated server call must forward the request cookie explicitly.
- Generated output in `packages/api-client` is committed, never edited by hand, and checked in continuous integration by regeneration followed by a clean diff check.
- Failures use Problem Details with a stable application code, request identifier, and field errors when relevant.
- Breaking API changes require a coordinated web and API release. A public versioning scheme is deferred until a second independent consumer exists.

## Routing and revalidation

- Fixed staging and production domains are the only Better Auth trusted web origins.
- Automatic Vercel previews receive no dashboard, auth, revalidation, database, R2, or Resend secrets.
- Preview requests may read public staging API routes. State changing requests from preview origins are rejected.
- NestJS sends content refresh requests to the fixed staging or production `WEB_REVALIDATION_URL` at `/internal/revalidate`.
- The request carries a timestamp and an HMAC SHA 256 signature over the timestamp and body using `REVALIDATION_SECRET`.
- Next.js rejects an invalid signature, a timestamp older than five minutes, or an unknown content tag.

## Interface foundation

- Tailwind CSS supplies tokens and utility styles.
- Radix UI Primitives supply focus, keyboard, dialog, menu, and overlay behavior.
- Project owned components define the portfolio look and prevent a generic component library appearance.
- WCAG 2.2 AA remains the quality target for public and dashboard routes.

## Consequences

- Next.js cannot import Prisma or backend domain services.
- Server Component data and TanStack Query data need distinct ownership rules.
- OpenAPI generation becomes a required part of API changes.
- One Next.js application avoids duplicated authentication and design work, but the dashboard cannot deploy independently.

## Rationale

This split is heavier than a Next.js only application, but it is justified by the product's real dashboard and the owner's goal of demonstrating backend engineering. Narrow shared packages preserve the API boundary and keep the system closer to a modular monolith than a distributed service collection.
