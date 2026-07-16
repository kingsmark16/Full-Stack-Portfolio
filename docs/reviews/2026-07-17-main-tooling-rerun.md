# Review, main, 2026-07-17

**Reviewed by**: GPT 5, degraded same model review (author on GPT 5)
**Scope**: updated tooling change set, uncommitted
**Verdict**: Approve with nits

## Summary

The updated tooling change set is internally consistent and all local quality checks pass. The previous Prettier dependency finding is resolved, and the runner mapping is documented in the root project context. One stale sentence remains in the curated context file, plus one small specification wording gap.

## Minor

### Root context still says tooling will be configured, `AGENTS.md:35`

**Problem**: The tooling rule says `/develop tooling` will configure what is not present yet, even though the formatter, hooks, checks, and CI are now present.

**Why it matters**: Future agents may treat the completed tooling as unfinished and repeat the setup work.

**Suggested fix**: Change the sentence to describe the tooling as already configured. This is curated prose, so update it intentionally rather than through automatic sync.

## Nits

- `docs/specs/_root/0001-tooling.md:133`, the final ignore list includes `.agents`, `.claude`, and `next-env.d.ts`, but the implementation contract does not name those generated paths. Keep the contract synchronized if this boundary is permanent.

## Strengths

- The API now relies on the root Prettier installation, so formatting has one source of truth.
- The local formatting, lint, type check, unit test, browser test, and Commitlint checks all pass after the update.

## Test coverage

The existing web Vitest, API Jest, and Playwright tests pass. Commitlint rejects invalid messages and accepts a valid Conventional Commit message. GitHub Actions and the `main` branch ruleset still require a GitHub run after the repository is pushed.
