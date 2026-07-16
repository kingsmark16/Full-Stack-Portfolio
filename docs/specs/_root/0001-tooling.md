# 0001. Repository tooling standard

**Date**: 2026-07-17
**Status**: Accepted

## Summary

This decision makes quality checks consistent across the portfolio monorepo. Prettier formats files, ESLint finds code issues, TypeScript checks types, and tests prove behavior. Husky stops invalid commits locally while GitHub Actions repeats the full gate before merge.

## Context

The scaffold has separate Next.js and NestJS linting and testing commands, but no shared formatter check, dedicated type check, commit guard, or continuous integration workflow. Without one standard, a command can pass locally while another workspace or a pull request is not checked.

The project uses pnpm and Turborepo on Windows today, with GitHub as the planned collaboration host. The engineer wants small guided manual steps, so each tool must have a clear root command and avoid hidden behavior.

## Options considered

### Option 1: Husky, lint staged, Prettier, and GitHub Actions

Use Git hooks for fast local feedback and repeat every required check in GitHub Actions.

**Pros**:

- Works with pnpm, Windows Git, and the existing ESLint and Jest setup.
- Limits formatting and lint fixes to staged files while preserving a full type check.
- Keeps local feedback fast enough and CI authoritative.

**Cons**:

- Developers install and maintain Git hooks locally.
- Type checking on every commit becomes slower as the repository grows.

### Option 2: Lefthook and GitHub Actions

Use Lefthook for local hooks and the same continuous integration gate.

**Pros**:

- Fast hook runner with clear configuration.

**Cons**:

- Adds a less familiar tool when the project does not need its advanced features.

### Option 3: GitHub Actions only

Run all checks after code is pushed and do not block local commits.

**Pros**:

- No local hook setup.

**Cons**:

- Feedback arrives later and invalid commits enter local history.

## Decision

**Chosen option**: Husky, lint staged, Prettier, commitlint, and GitHub Actions.

Use Prettier as the only formatter. Use Husky hooks with lint staged for staged file formatting, then run the repository lint and type checks before each commit. Use commitlint to enforce Conventional Commits. GitHub Actions repeats format, lint, type checks, unit tests, and Playwright browser tests on pull requests and pushes to `main`.

Dependabot opens grouped npm updates every week and GitHub Actions updates every month. Workflow permissions stay read only, workflows use no provider secrets, and newer runs cancel older runs for the same pull request.

## Rationale

The repository is small and uses standard JavaScript tooling, so familiar tools are the lowest risk choice. Husky and lint staged provide fast feedback without scanning every source file for formatting. A full type check before commit catches cross workspace errors that staged file linting cannot see. Continuous integration remains the final authority because local hooks can be skipped.

## Standard definition

**Canonical pattern**:

```text
git commit
  -> Husky pre commit
  -> lint staged formats staged files
  -> pnpm lint
  -> pnpm typecheck
  -> Husky commit message hook
  -> commitlint validates the Conventional Commit message

pull request or push to main
  -> GitHub Actions installs with the lockfile and installs Chromium for Playwright
  -> format check, lint, typecheck, pnpm test, and pnpm test:e2e
```

**Replaces**:

- Running workspace checks only when remembered.
- Allowing arbitrary commit messages.
- Treating a local build as the only merge gate.

**Enforcement**:

Prettier checks the repository with a root command. ESLint and TypeScript run through Turborepo workspace tasks. Husky runs lint staged, lint, typecheck, and commitlint locally. GitHub Actions repeats all quality commands with `permissions: contents: read`.

**Rollout**:

Enforce immediately for all new and changed files. Existing generated files, build outputs, dependency directories, coverage, Playwright reports, and dependency lockfiles remain outside Prettier and lint staged globs.

**Exceptions**:

Git hooks may be skipped only for an emergency recovery commit. The GitHub Actions gate still applies before merge.

## Implementation contract

### Dependencies and scripts

Add these root development dependencies: `prettier`, `husky`, `lint-staged`, `@commitlint/cli`, and `@commitlint/config-conventional`.

Add these root scripts:

```text
format        prettier --write .
format:check  prettier --check .
typecheck     turbo run typecheck
prepare       husky
```

Keep the existing root `lint`, `test`, and `test:e2e` scripts. Turborepo must declare `typecheck` with no output files because TypeScript runs with `--noEmit`.

Each current application must expose a read only `typecheck` script:

```text
apps/web  tsc --noEmit
apps/api  tsc --noEmit
```

The API `lint` script must become read only by removing `--fix`. Add a separate `lint:fix` script for an intentional whole API autofix. The Nest API type check covers its source and test TypeScript through its existing `tsconfig.json` includes.

### Formatter and staged files

Create a root Prettier configuration and a root ignore file. Use `singleQuote: true`, `semi: false`, and `trailingComma: "all"`. Ignore `node_modules`, `.next`, `dist`, `coverage`, `playwright-report`, `test-results`, generated Nest output, and all lockfiles.

Create `lint-staged.config.mjs` with this one mapping:

```text
*.{js,jsx,ts,tsx,json,yml,yaml,md,css}  -> prettier --write
```

The pre commit hook must run lint staged, then `pnpm lint`, then `pnpm typecheck`. It formats only staged supported files, while lint and type checks remain read only. Do not use a broad ESLint autofix in a commit hook.

### Commit messages and TypeScript policy

Create a Commitlint configuration that extends `@commitlint/config-conventional`. Create a Husky `commit-msg` hook that runs `pnpm exec commitlint --edit "$1"`.

Keep the root rule against `any`. Restore `@typescript-eslint/no-explicit-any` in the API ESLint configuration. A future exception must be local, documented, and use an ESLint disable comment with a reason, not a repository wide rule disable.

### Continuous integration

Create `.github/workflows/ci.yml` with a single workflow named `Quality checks`. It runs on pull requests and pushes to `main`, uses the Node 24 and pnpm 11 versions declared by the repository, and installs dependencies with `pnpm install --frozen-lockfile`.

The `quality` job runs these commands in this order:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

The workflow has `permissions: contents: read` and concurrency keyed by the workflow and pull request or branch, with in progress runs cancelled. It uses no provider or deployment secrets. On a failure, it uploads the Playwright report and test results as artifacts when they exist.

After this workflow reaches GitHub, the repository owner must configure a GitHub branch ruleset for `main` that requires the `Quality checks / quality` status check before merge. That web setting cannot be enforced only from a committed workflow file.

### Dependency updates

Create `.github/dependabot.yml`. Group npm dependency updates for the root directory every week. Check GitHub Actions updates every month. Dependabot pull requests are still subject to the same `Quality checks` gate.

### Acceptance criteria

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` pass from the repository root.
- A staged supported file is formatted by the pre commit hook, while an unstaged file is untouched.
- A lint or type error makes the pre commit hook fail before creating the commit.
- `git commit -m "invalid message"` fails, while `git commit -m "chore: configure tooling"` passes Commitlint.
- The `Quality checks / quality` workflow runs the exact required commands on a pull request and on a push to `main`.
- A failed browser test leaves a downloadable Playwright report or test result artifact when one is generated.
- The `main` branch ruleset requires the `Quality checks / quality` status check before merge.

## Consequences

**Positive**:

- Every developer and pull request uses the same quality gate.
- Formatting, commit messages, types, and tests fail close to the mistake.
- CI has no provider secrets and only read access to repository contents.

**Negative and tradeoffs**:

- The first commit after a type heavy change can take longer.
- Husky setup is another local dependency and Git hook directory to maintain.
- Playwright browser tests increase CI time.

**Neutral**:

- The root `pnpm test` command remains unit focused. `pnpm test:e2e` runs browser coverage separately.
- The API keeps Jest and Supertest. The web configuration keeps Vitest. Playwright covers the cross application browser path.

## Follow up

- [ ] Add a repository specific type check script to each future workspace.
- [ ] Review test runner preferences when a new workspace adds a different test framework.
