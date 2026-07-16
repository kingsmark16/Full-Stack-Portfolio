# Foundation setup log

**Started**: 2026-07-17  
**Scope**: [Stack and architecture](../scope/foundations.md)  
**Decision record**: [Spec 0001](../specs/0001-stack-architecture/index.md)

This is the working record for the initial monorepo scaffold. It records commands that were run, important setup choices, and their results. Do not put passwords, API keys, database URLs, or other secrets in this file.

## Working preference

The engineer types code and runs commands by default. The assistant gives small, ordered steps and explains the expected result. The assistant runs a command or edits a file only when asked.

## Environment confirmed

| Tool     | Confirmed version  |
| -------- | ------------------ |
| Node.js  | `v24.12.0`         |
| Corepack | `0.34.5`           |
| pnpm     | `11.13.1`          |
| Git      | `2.49.0.windows.1` |
| Docker   | `29.6.1`           |

`corepack enable pnpm` initially required elevated Windows permissions because Node.js is installed under `C:\Program Files\nodejs`. pnpm was then available and confirmed with `pnpm --version`.

## Repository created

```powershell
git init -b main
```

Result: a new Git repository was created with `main` as its default branch.

The root workspace files were then created:

1. `package.json` defines Node.js and pnpm version ranges and root Turborepo commands.
2. `pnpm-workspace.yaml` registers `apps/*` and `packages/*`.
3. `.gitignore` excludes generated output, dependencies, logs, and environment files.

Dependencies were installed with:

```powershell
pnpm install --network-concurrency=1 --fetch-timeout=120000
```

The lower network concurrency and longer timeout were used after registry connection issues. pnpm requested approval to run the required install scripts for `sharp` and `unrs-resolver`. Both were reviewed and approved with `pnpm approve-builds`.

## Next.js web application

The workspace directories were created:

```powershell
New-Item -ItemType Directory -Path apps, packages
```

The web application was scaffolded with:

```powershell
pnpm create next-app@latest apps/web --ts --eslint --tailwind --app --src-dir --turbopack --use-pnpm --import-alias "@/*" --empty --skip-install --disable-git --yes
```

Result: `apps/web` contains the Next.js App Router application.

An extra `apps/web/pnpm-workspace.yaml` was removed because it caused Next.js to report multiple workspace lockfile configuration. After removal, the web build completed without that warning.

## Turborepo added

```powershell
pnpm add -Dw turbo
pnpm exec turbo --version
```

Result: Turborepo `2.10.5` is installed at the workspace root. `turbo.json` defines the shared `dev`, `build`, `lint`, `typecheck`, and `test` tasks.

The editor may show that `https://turborepo.dev/schema.json` is untrusted. This affects editor schema validation only. It does not prevent Turborepo from running. The schema reference remains in `turbo.json`.

## NestJS API application

The API application was scaffolded with:

```powershell
pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --skip-git --skip-install --strict
pnpm install --network-concurrency=1 --fetch-timeout=120000
```

Result: `apps/api` contains the NestJS application. The root install reported deprecated indirect dependencies from the generated toolchain. No direct dependency change is required for the scaffold.

The API development command was added to `apps/api/package.json`:

```json
"dev": "nest start --watch"
```

`apps/api/src/main.ts` listens on port `3001` by default and respects `PORT` when supplied.

## Web to API route

`apps/web/next.config.ts` defines rewrites for `/api` and `/api/:path*` to the API origin. It uses `API_INTERNAL_URL`, or `http://localhost:3001` locally, and removes a trailing slash before forming the destination.

This keeps browser requests on the web origin during local development and provides the intended API boundary for later deployment.

## Build and runtime proof

The application builds completed successfully:

```powershell
pnpm --filter web build
pnpm --filter api build
pnpm build
```

The final root build result reported successful `api` and `web` tasks.

Both applications were started with:

```powershell
pnpm dev
```

The API was verified directly and through the Next.js rewrite:

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3001/).Content
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/api).Content
```

Expected and observed result for both commands:

```text
Hello World!
```

`-UseBasicParsing` avoids the PowerShell warning about parsing page scripts. The development processes were stopped with `Ctrl+C` after this check.

## Current state

The stack and architecture foundation is complete. The `/check verify` and `/test` scope steps passed. Database access, authentication, storage, email, monitoring, Docker delivery work, and dashboard features are planned for later feature slices and are not installed as part of this scaffold.

## Coding standards context

The project standards were recorded after the scaffold with `/audit`.

1. The selected code structure is Clean Architecture with strict TypeScript and feature based folders.
2. Public APIs require documentation, API errors need one consistent pattern, and required environment variables must be validated at startup.
3. User interfaces must meet a WCAG AA accessibility baseline.
4. The intended tooling standard is ESLint, Prettier, commit checks, automated tests, and GitHub Actions checks. The later `/develop tooling` task will configure the parts that are not present yet.
5. The guided manual implementation preference is recorded so future sessions wait for the engineer to run code and commands unless explicitly asked to act.

The following context files were created:

```text
AGENTS.md
CLAUDE.md
apps/web/AGENTS.md
apps/web/CLAUDE.md
apps/api/AGENTS.md
apps/api/CLAUDE.md
```

The Agent Skill registry was queried for Next.js, Prisma, and NestJS. It returned no matching skills. Neon and Cloudflare R2 MCP connections remain recommended but are not connected.

## Automated tests

The following test tools were added at the workspace root:

```text
vitest
@playwright/test
```

Playwright Chromium was installed with:

```powershell
pnpm exec playwright install chromium
```

The test preferences are stored in `test-preferences.json`. Vitest is the unit test tool and Playwright is the browser test tool.

The following test files were added:

1. `apps/web/next.config.test.ts` checks the local API fallback and custom `API_INTERNAL_URL` trailing slash handling.
2. `e2e/portfolio.spec.ts` checks that the public page loads and that a browser request to `/api` reaches NestJS.

The web workspace now has `test` and `test:e2e` commands. The root workspace also has `test:e2e` so browser tests can run from the repository root.

The following commands passed:

```powershell
pnpm --filter web test
pnpm --filter api test -- --runInBand
pnpm --filter api test:e2e
pnpm test
pnpm test:e2e
```

Final results were two passing Vitest tests, one passing API unit test, one passing API integration test, and two passing Playwright browser tests. The Turborepo test task was adjusted so it does not expect coverage output when no coverage files are generated.

## How to continue this log

For each later milestone, add a dated section with:

1. The feature or decision link.
2. The exact commands run.
3. Files intentionally changed.
4. The verification result.
5. Any warning, failure, or follow up that matters.
