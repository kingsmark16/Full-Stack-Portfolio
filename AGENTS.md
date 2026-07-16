# Portfolio

## Stack

- **Language and runtime**: TypeScript, Node.js 24
- **Workspace**: pnpm workspaces and Turborepo
- **Applications**: Next.js web app and NestJS API
- **Key boundaries**: the web app has no direct database access, the API owns data, identity, validation, and business rules

## Build approach

Journey. Finish one complete visitor or owner path before starting the next.

## Commands

```powershell
pnpm install
pnpm dev
pnpm build
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Rules

- Use Clean Architecture for new feature code. Keep domain and application code independent of Next.js, NestJS, Prisma, and I O.
- Use strict TypeScript. Do not introduce `any`. Keep boundary types explicit and exhaustive.
- Organize new code by feature. Keep each feature's UI, API, application logic, and tests close to its feature folder.
- Keep use cases thin. Put business rules and invariants in domain objects or focused domain services.
- Use DTOs or plain objects across boundaries. Do not expose domain entities from controllers or UI code.
- Document public APIs, use one consistent error pattern, and validate required environment variables before accepting traffic.
- Keep accessible semantics, keyboard support, visible focus, labels, and WCAG AA contrast in every UI feature.
- Use conventional commits. The repository uses ESLint, Prettier, commit checks, automated tests, and GitHub Actions checks.
- Git hooks format staged files and run lint and type checks before commits. GitHub Actions repeats the quality checks for pull requests and pushes to `main`.
- Test web configuration with Vitest, API behavior with Jest and Supertest, and cross application behavior with Playwright.
- Before any code change, file edit, package installation, or project command, ask whether the engineer wants to do it. Give one small step at a time with the target, exact code or command, expected result, and a detailed explanation. If the engineer says no, the assistant runs that scoped coding or command step and verifies the result.

## Specs

Architecture decisions live in `docs/specs/`. The current foundation decision is [Spec 0001](docs/specs/0001-stack-architecture/index.md).

## Agent skills

- [architect](.agents/skills/architect/): local workflow skill for load bearing decisions and specs.
- [audit](.agents/skills/audit/): local workflow skill for maintaining AI context files.
- [check](.agents/skills/check/): local workflow skill for behavior verification and code review.
- [develop](.agents/skills/develop/): local workflow skill for implementing approved specs.
- [scope](.agents/skills/scope/): local workflow skill for project scope and feature order.
- [sync](.agents/skills/sync/): local workflow skill for reconciling durable project knowledge.
- [test](.agents/skills/test/): local workflow skill for adding appropriate automated tests.

MCP servers: Neon (recommended, connection pending), Cloudflare R2 (recommended, connection pending).

## Context files

- [apps/web/AGENTS.md](apps/web/AGENTS.md): Next.js application commands and boundaries.
- [apps/api/AGENTS.md](apps/api/AGENTS.md): NestJS application commands and boundaries.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
