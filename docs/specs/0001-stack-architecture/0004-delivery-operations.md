# Delivery and operations

## Summary

Deploy Next.js and NestJS to managed platforms, with Neon, R2, and Resend as managed development and production resources. Use Docker only for the API image. Every release is checked, migrated, observed, and recoverable.

## Decision

**Chosen option**: Managed delivery with a containerized API

Deploy Next.js to Vercel, deploy the NestJS Docker image to Railway, and keep PostgreSQL on Neon. Use GitHub Actions for required checks and controlled releases. (basis: managed platform practice for a solo production project)

## Environments

| Environment            | Web                                             | API and providers                                              | Purpose                        |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ------------------------------ |
| Local                  | Local Next.js                                   | Local NestJS with isolated managed development resources       | Daily development              |
| Preview                | Automatic Vercel preview with public reads only | Shared staging API with no preview secrets or writes           | Review public frontend changes |
| Continuous integration | Local processes in the runner                   | Isolated test services and test doubles                        | Deterministic automated checks |
| Production             | Vercel production                               | Railway, Neon, R2, Resend, and monitoring production resources | Public operation               |

- Docker builds and runs the NestJS API image.
- Local development does not run provider containers.
- Environment names, identifiers, and credentials are validated and cannot silently fall back to production.

## Configuration contract

| Value                         | Used by                   | Source and environments                                                                               |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `API_INTERNAL_URL`            | Next.js server            | Railway API origin in staging and production, local API origin in local and continuous integration    |
| `NEXT_PUBLIC_API_BASE_PATH`   | Next.js browser           | `/api` in every environment                                                                           |
| `WEB_ORIGIN`                  | Both applications         | Fixed local, staging, or production web origin, never an automatic preview origin for auth            |
| `API_ORIGIN`                  | NestJS                    | Direct local or Railway API origin                                                                    |
| `DATABASE_URL`                | NestJS runtime and worker | Pooled Neon URL for development, staging, and production, isolated test URL in continuous integration |
| `DIRECT_URL`                  | Prisma release command    | Direct Neon URL available only to migration jobs                                                      |
| `BETTER_AUTH_SECRET`          | NestJS                    | Separate provider secret per local, staging, and production environment                               |
| `BETTER_AUTH_URL`             | NestJS                    | Public same origin auth base for the fixed environment                                                |
| `BETTER_AUTH_TRUSTED_ORIGINS` | NestJS                    | Fixed local, staging, and production web origins                                                      |
| `R2_ENDPOINT`                 | NestJS                    | Environment specific Cloudflare account endpoint                                                      |
| `R2_BUCKET`                   | NestJS                    | Separate development, staging, production, and backup bucket names                                    |
| `R2_ACCESS_KEY_ID`            | NestJS or backup job      | Least privilege provider secret per environment                                                       |
| `R2_SECRET_ACCESS_KEY`        | NestJS or backup job      | Least privilege provider secret per environment                                                       |
| `R2_PUBLIC_BASE_URL`          | NestJS                    | Public asset origin for development, staging, and production content buckets                          |
| `RESEND_API_KEY`              | NestJS and worker         | Separate development, staging, and production provider secret                                         |
| `EMAIL_FROM`                  | NestJS and worker         | Verified environment sender address                                                                   |
| `WEB_REVALIDATION_URL`        | NestJS                    | Fixed staging or production Next.js origin, local web origin during development                       |
| `REVALIDATION_SECRET`         | Both applications         | Matching server only secret per fixed environment                                                     |
| `SENTRY_DSN`                  | Both applications         | Environment specific Sentry project setting                                                           |
| `SENTRY_AUTH_TOKEN`           | Build job                 | Provider secret used only for source map release work                                                 |
| `SENTRY_ENVIRONMENT`          | Both applications         | `development`, `test`, `staging`, or `production`                                                     |
| `LOG_LEVEL`                   | NestJS and worker         | Validated environment log threshold                                                                   |

Automatic Vercel previews receive only public build configuration and the public staging read path. They receive none of the secrets in this table.

## Test and release gates

- Vitest covers Next.js and shared package units.
- Jest and Supertest cover NestJS units and API integration.
- Playwright covers complete visitor and owner journeys.
- GitHub Actions runs formatting checks, linting, type checks, unit tests, integration tests, production builds, and selected Playwright journeys.
- A release runs `prisma migrate deploy` once before the new API receives traffic.
- A failed migration or health gate stops traffic promotion.
- Schema changes use expand and contract releases. The order is additive migration, compatible API and worker, health and auth proof, web deployment, then cleanup migration in a later release.
- Only protected main branch workflows with environment approval may migrate staging or production.
- Pull requests from forks receive no provider or deployment secrets.

## Security baseline

- Apply secure headers, strict validation, request size limits, endpoint rate limits, secret management, and log redaction.
- Same origin routing is the default. Any direct service origin rejects unapproved browser origins.
- State changing cookie requests enforce the auth library's origin and CSRF protections.
- R2, Neon, Resend, Sentry, Vercel, and Railway credentials use the least access needed for each environment.
- Contact data, auth events, deletion, and retention rules are completed by their feature specs.

## Recovery and maintenance

- Choose a Neon plan with managed point in time recovery before production.
- A scheduled GitHub Actions workflow runs `pg_dump` weekly with a read limited backup credential.
- The workflow encrypts the dump with `age` using a public key stored in the repository and uploads it to a private R2 backup bucket with version retention. The private recovery key stays outside GitHub in the owner's password manager.
- Test restoration on a regular schedule and before relying on a new recovery mechanism.
- Pin Node.js 24 LTS and the exact pnpm release in repository metadata.
- Commit the pnpm lockfile.
- Dependabot opens grouped weekly dependency updates.
- Multiple regions and container orchestration remain deferred.

## MCP safety

- Neon MCP may connect only to development and test branches with no production or personal data.
- Cloudflare MCP receives access only to the portfolio's nonproduction R2 resources during build work.
- Production changes through an MCP require a later explicit architecture update and are not authorized by this spec.

## Consequences

- Managed services reduce server work but create provider specific configuration and spending limits.
- A shared staging API cannot reproduce every branch combination.
- Release migrations require backward compatible changes when web and API rollout overlap.
- Recovery is only credible when restore tests continue to run.

## Rationale

A solo engineer with a small monthly budget should not operate orchestration or mail infrastructure. Managed platforms keep the work focused on the portfolio, while Docker preserves API portability. The Full workflow requires meaningful automated and operational proof, so tests, migration gates, monitoring, and recovery are part of the foundation rather than launch cleanup.
