# API application

## Overview

This workspace is the NestJS API. It is the only application that will own stored data, authentication, authorization, validation, and portfolio business rules.

## Key files

| File                    | Owns                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `src/main.ts`           | NestJS bootstrap and local port selection.                  |
| `src/app.module.ts`     | Root NestJS module.                                         |
| `src/app.controller.ts` | Scaffold HTTP route.                                        |
| `package.json`          | API workspace commands, testing, linting, and dependencies. |

## Commands

```powershell
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api lint:fix
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api test:e2e
```

## Conventions

- Follow the root [AGENTS.md](../../AGENTS.md) rules.
- Keep NestJS controllers in the presentation layer. Route business work through application use cases.
- Add DTO validation at API boundaries. Keep domain objects independent of NestJS and Prisma.
- Use Prisma only inside API infrastructure code when the data model feature is built.
- Keep API responses as DTOs or plain objects. Do not expose persistence or domain objects directly.

## Gotchas

The API listens on port `3001` by default and accepts a `PORT` value for another port. The web development server proxies `/api` to this application.

## Related specs

[Spec 0001](../../docs/specs/0001-stack-architecture/index.md)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
