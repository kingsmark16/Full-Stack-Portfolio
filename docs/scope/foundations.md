# Foundations

These features establish the real project before any visitor or owner journey begins.

### 1. Stack and architecture · done

Record the pnpm monorepo, Next.js public and dashboard surfaces, NestJS API, shared boundaries, persistence needs, and deployment shape. Scaffold only the runnable core that the first journey needs.
**Done when:** the architecture is recorded, the monorepo boots locally, each application builds, and the empty site can reach the API.

- [x] Decide the stack (spec): `/architect stack and architecture`
- [x] Scaffold from the decision: `/develop stack and architecture`
- [x] Verify it: `/check verify stack and architecture`
- [x] Test it: `/test stack and architecture`
      [Spec 0001](../specs/0001-stack-architecture/index.md) · code in `apps/web/` and `apps/api/`

### 2. Coding standards and tooling · in-progress

Capture conventions from the real scaffold, then add the checks that every later feature must follow.
**Done when:** root `AGENTS.md` reflects the real project, and formatting, linting, type checks, commit checks, and continuous integration run cleanly.

- [x] Capture conventions and tooling choices: `/audit`
- [x] Decide tooling standard (spec): `/architect tooling`
- [x] Install the tooling: `/develop tooling`
- [x] Check it runs cleanly: `/test tooling`
      [Tooling spec](../specs/_root/0001-tooling.md) · tooling in `package.json`, `.prettierrc.json`, `.prettierignore`, `lint-staged.config.mjs`, `commitlint.config.mjs`, `.husky/`, and `.github/`

### 3. Portfolio data model · needs a decision

Define the content, ownership, contact, media, and publishing records that support both public pages and the dashboard without costly redesign.
**Done when:** the model supports one owner, profile details, skills, experience, education, certifications, services, projects, media, the current resume, and contact messages with clear relationships and deletion rules.

- [ ] Design it (spec): `/architect portfolio data model`

### 4. Design system and UI foundation · needs a decision

Create one visual language and a shared set of accessible interface patterns for the public site and private dashboard.
**Done when:** the design direction covers type, color, spacing, layout, motion, content states, and responsive components that meet WCAG 2.2 AA for focus, keyboard use, labels, contrast, and structure.

- [ ] Design it (spec): `/architect design system and UI foundation`

### 5. Connected portfolio skeleton

Prove the core path across stored data, the API, and the public interface before full page work starts.
**Done when:** one real portfolio record can be stored, returned through the API, and rendered by the site, with loading, empty, and error states and clean local builds.

- [ ] Build it: `/develop connected portfolio skeleton`
