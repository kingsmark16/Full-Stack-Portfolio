# Review, main, 2026-07-17

**Reviewed by**: GPT 5, degraded same model review (author on GPT 5)
**Scope**: tooling change set, uncommitted
**Verdict**: Approve with nits

## Summary

The tooling setup is coherent and the local quality gates pass. The hooks, formatter, lint checks, type checks, browser tests, commit rules, CI workflow, and dependency update policy match the accepted tooling decision. Two minor consistency issues remain, neither blocks merging.

## Minor

### API keeps a second Prettier dependency, `apps/api/package.json:47`

**Problem**: The root package uses Prettier 3.9.5, while the API workspace still declares Prettier 3.4.2 and exposes a workspace format script.

**Why it matters**: Running the API workspace format command can use a different formatter version and configuration than the root quality gate, which weakens the single formatter standard.

**Suggested fix**: Remove the API specific Prettier dependency and format script, or make the workspace command resolve the same root formatter and configuration.

### Test preference names one runner for two workspace runners, `test-preferences.json:2`

**Problem**: The preference file names Vitest as the project tool, while the API uses Jest and the root test command runs both.

**Why it matters**: A future test workflow may choose Vitest for an API change unless it also reads the API workspace convention.

**Suggested fix**: Record the per workspace runner mapping in the test preferences format or in a clearly linked test convention so future test runs cannot mistake the default for the API runner.

## Nits

- `docs/specs/_root/0001-tooling.md:133`, the final generated file ignores include `.agents`, `.claude`, and `next-env.d.ts`, but the implementation contract does not list those additions. Keep the contract synchronized if the ignore boundary is intended to remain permanent.

## Strengths

- The read only lint and type check split is clear, and the pre commit hook runs the intended commands in order.
- CI uses locked installs, read only permissions, stale run cancellation, Chromium installation, and browser artifacts.

## Test coverage

The existing web Vitest, API Jest, and Playwright tests pass. Commitlint was exercised with both invalid and valid messages. The GitHub workflow and main branch ruleset still require a GitHub run after the repository is pushed.
