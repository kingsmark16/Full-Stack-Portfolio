# Rationale for full stack portfolio architecture

## Context

> Premise note: A separate Next.js application and NestJS API is more work than a Next.js only portfolio. It is justified here because the product includes a real owner dashboard, stored content, uploads, contact handling, and a deliberate goal of demonstrating backend engineering. The right framing is still a modular monolith, not microservices.

This is a new production portfolio for one engineer. Hiring managers and technical interviewers are the main audience. The first useful release is expected within two to four weeks, with free plans where practical and a small monthly budget when needed.

The engineer is also using the build as a learning process. They want to type code and run commands themselves by default, with the assistant providing small explained steps. The assistant only takes over a step when asked to execute or fix it.

The public site must be fast, searchable, accessible to WCAG 2.2 AA, and easy to update without code changes. The private dashboard handles one owner, uploaded files, account recovery, and contact messages. These features introduce personal data and authentication risk, although no regulated health, payment, or enterprise compliance scope applies.

The repository has no source code or established conventions yet. The architecture must therefore be explicit enough to scaffold safely, but it must not predesign the later portfolio data model, identity rules, or page behavior that already have their own scope features.

## Options considered

### Option 1: Managed TypeScript modular monolith

One monorepo contains one Next.js application and one NestJS API. Managed database, file, email, and hosting services reduce operations. (basis: the project scope, monolith first practice, and official framework guidance)

**Pros**:

- Demonstrates frontend and backend engineering through a real service boundary.
- Keeps one language and one repository.
- Managed services fit a solo engineer.

**Cons**:

- Costs more build and deployment work than a single application.
- Adds provider integration and same origin routing concerns.

### Option 2: Next.js only full stack application

Next.js owns pages, server actions, route handlers, Prisma, and authentication in one deployable application. (basis: Next.js server rendering and data fetching capabilities)

**Pros**:

- Fastest path to a working portfolio.
- One deployment and fewer network boundaries.

**Cons**:

- Provides less direct evidence of NestJS backend engineering.
- Couples public rendering, dashboard behavior, and backend rules in one application boundary.

### Option 3: Static Next.js with a managed content system

A hosted content product owns editing and delivery, while Next.js renders the public portfolio. (basis: buy before build practice for commodity content management)

**Pros**:

- Delivers editing with little custom backend work.
- Reduces authentication and database responsibility.

**Cons**:

- Misses the stated goal of building and demonstrating the backend.
- Limits control over the owner workflow and domain behavior.

### Option 4: Containerized applications on one virtual server

Next.js, NestJS, and supporting services run as containers on a maintained server. (basis: container portability and operational simplicity at small scale)

**Pros**:

- Gives full infrastructure control and one hosting bill.
- Reduces dependence on application hosting platforms.

**Cons**:

- Makes the solo engineer responsible for patching, availability, backups, and routing.
- Uses launch time on infrastructure rather than portfolio value.

## Rationale

Option 1 best matches the unusual but valid product goal. The dashboard gives NestJS real work, while the monorepo and modular API prevent the service boundary from becoming a microservice program. Managed providers trade some portability and cost predictability for the operating simplicity needed by one engineer. (basis: the project scope and managed platform practice)

Option 2 is the strongest runner up and would be the recommendation for a portfolio whose only goal was content publishing. It was not chosen because backend evidence is part of the product outcome, not an incidental technology preference. Options 3 and 4 each remove useful work in one area by creating a mismatch in another, either too little backend ownership or too much infrastructure ownership.

The finer choices follow the same rule. PostgreSQL, an ORM, object storage, a proven auth library, and a database outbox are established defaults for this data shape and traffic level. TanStack Query and Zustand receive narrow roles so they do not duplicate server ownership. Better Auth remains the notable risk, so its integration proof is a required gate rather than an optimistic assumption. (basis: official Prisma Neon, Better Auth NestJS, Next.js data fetching, TanStack Query, and Zustand guidance)

## Landscape notes

- Node.js 24 is the selected LTS line. Node.js 20 is no longer an acceptable production target. (basis: official Node.js release schedule)
- Next.js Server Components can fetch on the server. TanStack Query remains useful for interactive client behavior but needs deliberate server and client ownership. (basis: official Next.js and TanStack Query guidance)
- Zustand stores must not become global request shared state in Next.js. (basis: official Zustand Next.js guidance)
- Prisma with Neon needs pooled runtime access and direct migration access. Neon scale to zero may add cold start latency. (basis: official Prisma Neon guidance)
- Better Auth's NestJS integration is community maintained, changes body parsing, installs a global guard, and has greater risk on Fastify. (basis: official Better Auth NestJS guidance)
- NestJS uses its standard DTO validation pipeline. Zod needs a custom integration if forced into that boundary. (basis: official NestJS validation guidance)

## References

**Project sources**:

- `docs/scope/index.md`, product, workflow, and Journey approach
- `docs/scope/foundations.md`, stack and architecture outcome
- The engineer's confirmed stack interview decisions from 2026-07-17

**Practices and standards**:

- Modular monolith and monolith first
- Managed platforms for small teams
- REST with generated contracts for one controlled client
- Object storage for files
- Transactional outbox for retryable work
- Structured logs and hosted error tracking from the first release
- Least privilege provider access
- Point in time recovery plus independent restore testing

**Links**:

- Node.js releases: https://nodejs.org/en/about/previous-releases
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js data fetching: https://nextjs.org/docs/app/getting-started/fetching-data
- TanStack Query advanced server rendering: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Zustand with Next.js: https://zustand.docs.pmnd.rs/guides/nextjs
- Prisma with Neon: https://www.prisma.io/docs/orm/overview/databases/neon
- Better Auth with NestJS: https://better-auth.com/docs/integrations/nestjs
- NestJS validation: https://docs.nestjs.com/techniques/validation
- pnpm workspaces: https://pnpm.io/workspaces
- NestJS workspaces: https://docs.nestjs.com/cli/monorepo
- Neon MCP server: https://neon.com/docs/ai/neon-mcp-server
- Cloudflare MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
