# 0001. Full stack portfolio architecture

**Date**: 2026-07-17
**Status**: Accepted

## Summary

Build one TypeScript monorepo with a Next.js web application and a NestJS API. NestJS owns data, identity, and business rules. Managed services keep operations small while the repository still demonstrates real frontend, backend, database, security, and delivery work.

## Structure

- [Application platform](0001-application-platform.md): repository shape, runtime, web rendering, API contract, client state, and interface foundations
- [Data and identity](0002-data-identity.md): PostgreSQL, Neon, Prisma, Better Auth, validation, and the service security boundary
- [Service integrations](0003-service-integrations.md): object storage, email, background work, content freshness, and observability
- [Delivery and operations](0004-delivery-operations.md): hosting, containers, environments, testing, continuous integration, releases, recovery, and dependency maintenance

## Decision

**Chosen option**: Managed TypeScript modular monolith

Use one pnpm and Turborepo workspace with `apps/web`, `apps/api`, and three narrow shared packages. Deploy the applications separately, but keep all backend business areas as modules inside one NestJS application. (basis: the project scope and monolith first practice)

**Selected MCP servers**: Neon MCP for development and test branches only, and Cloudflare MCP for nonproduction R2 resources only with least privilege access. Connection is pending user account authorization. (basis: official Neon and Cloudflare MCP guidance)

## Cross child contract

- `apps/web` owns presentation, public rendering, dashboard interaction, and no direct database access.
- `apps/api` owns Prisma, authentication, authorization, validation, business rules, files, notifications, and stored data.
- Browser traffic reaches NestJS through the same public origin under `/api` and uses secure HTTP only cookies.
- Vercel rewrites `/api/:path*` to the Railway API origin. Server Components use the server only `API_INTERNAL_URL` instead of the public rewrite.
- NestJS calls `/internal/revalidate` on the fixed Next.js environment origin with a timestamped HMAC signature. Automatic preview hosts cannot call it.
- NestJS publishes OpenAPI. `packages/api-client` is generated from that contract and is the only shared API client.
- `packages/ui` holds project owned interface components. `packages/config` holds shared TypeScript and tool configuration.
- Prisma types, domain services, and database code never move into a shared package.
- Public reads use Next.js Server Components. TanStack Query is reserved for interactive dashboard reads and mutations.
- Zustand stores shared interface state only. It never stores sessions, API records, or persisted portfolio content.
- A content mutation completes in NestJS, commits its outbox work, then triggers signed Next.js revalidation. A short cache lifetime limits stale content if revalidation fails.
- Production secrets live in provider secret stores. Every application validates required configuration before accepting traffic.
- The first release uses no Redis, external search engine, GraphQL, Kubernetes, or multiple region deployment.

## Implementation collaboration

- The engineer types the code and runs commands by default.
- The assistant gives one small step at a time, with the target file, exact code or change, exact command, expected result, and a short explanation.
- The assistant waits for the engineer's result before giving the next dependent step.
- The assistant does not edit files, install packages, or run implementation commands unless the engineer explicitly asks it to execute or fix that step.
- When the engineer asks the assistant to execute or fix a step, the assistant may act within that requested scope, verify the result, and return control to the engineer.
- Approval is still required for destructive actions, account changes, production access, paid resources, or any broader external effect.

## Proposed stack

| Layer                  | Choice                                                           | Reason                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime                | Node.js 24 LTS and TypeScript                                    | One supported language across the repository keeps a solo build coherent.                                |
| Workspace              | pnpm workspaces and Turborepo                                    | pnpm owns packages, while Turborepo owns task order and caching.                                         |
| Web                    | One Next.js App Router application                               | Public pages and `/dashboard` share design, identity wiring, and deployment.                             |
| API                    | NestJS on Express                                                | A structured backend boundary demonstrates backend work and lowers Better Auth adapter risk.             |
| API contract           | REST, OpenAPI, and Orval generated TypeScript clients            | One generated contract prevents frontend and backend drift.                                              |
| Primary database       | PostgreSQL on Neon                                               | The content and contact domain is relational and fits managed PostgreSQL.                                |
| Database access        | Prisma with the Neon adapter                                     | Prisma covers normal content work while Neon pooling supports managed connections.                       |
| Authentication         | Better Auth through NestJS                                       | A proven library avoids custom identity code while keeping identity under project control.               |
| Server data state      | Next.js Server Components and TanStack Query                     | Public reads stay server rendered, while dashboard interaction gets client caching and mutation support. |
| Client interface state | Zustand, used only when state spans components                   | It remains a small interface tool rather than a second data store.                                       |
| Validation             | Zod in Next.js and configuration, NestJS validation for API DTOs | Each framework uses its stable validation path and OpenAPI joins the boundary.                           |
| Interface              | Tailwind CSS, Radix UI Primitives, and project owned components  | The site stays distinct without rebuilding difficult accessibility behavior.                             |
| Forms                  | React Hook Form and Zod in Next.js                               | Repeated dashboard forms get consistent feedback before server validation.                               |
| Background work        | PostgreSQL outbox and a NestJS scheduled worker                  | Low volume retries stay durable without adding Redis.                                                    |
| File storage           | Cloudflare R2                                                    | Images and resumes belong in object storage, not PostgreSQL or the API file system.                      |
| Email                  | Resend                                                           | The expected notification volume needs a small transactional service, not mail infrastructure.           |
| Web hosting            | Vercel                                                           | It is the managed deployment target for the Next.js application.                                         |
| API hosting            | Railway with a Docker image                                      | NestJS gets a long running container without server management.                                          |
| Observability          | Sentry, Pino, health checks, and UptimeRobot                     | Errors, structured logs, health, and availability are visible from the first release.                    |
| Tests                  | Vitest, Jest, Supertest, and Playwright                          | Each layer gets focused tests and complete visitor and owner journeys are proven in a browser.           |
| Automation             | GitHub Actions and Dependabot                                    | Every change gets required checks and grouped dependency maintenance.                                    |

## Consequences

**Positive**:

- One language and one repository reduce context switching.
- The API boundary gives the portfolio credible backend depth.
- Managed platforms keep database, file, email, and deployment operations reasonable for one engineer.
- Narrow package sharing keeps ownership clear.
- The Full workflow has matching test, monitoring, and release foundations.

**Negative and tradeoffs**:

- A separate API costs more time and money than a Next.js only portfolio.
- Better Auth with NestJS relies on a community maintained adapter and must pass an integration proof before feature work.
- Several managed providers create more secrets, dashboards, billing limits, and failure surfaces.
- Same origin API routing and content revalidation need explicit production routing.
- Managed development resources require network access and careful separation from production.

**Neutral**:

- Current stable package versions are chosen and pinned during scaffold, while Node.js stays on the selected 24 LTS line.
- Complex reporting may use reviewed SQL even though normal data work uses Prisma.
- Public project filters use PostgreSQL. A search service remains deferred until measured requirements exceed it.

## Follow-up

- [ ] Connect Neon MCP only to development and test branches. Never grant it production or contact data access.
- [ ] Connect Cloudflare MCP with an account and token limited to nonproduction portfolio R2 resources.
- [ ] Prove Better Auth on NestJS Express before the scaffold is accepted, including body parsing, cookies, CSRF behavior, route guards, recovery email, and a normal validated API route.
- [ ] Confirm the selected Neon plan supports the required recovery window before production launch.
- [ ] Register and verify the production domain and Resend sender before contact and recovery email work.
- [ ] Keep detailed identity rules, portfolio entities, upload limits, and contact retention in their dedicated feature specs.
- [ ] Capture the guided manual implementation preference in root `AGENTS.md` so every later development session follows it.

## Rationale

Reasoning, alternatives, and verified sources: see [rationale.md](rationale.md).
