# 0003. Reset Public UI

**Date**: 2026-07-21
**Status**: In Progress

## Summary

Reset the public portfolio UI to a plain semantic baseline. Keep the live portfolio content, contact form, metadata, and accessibility behavior. Remove the current visual theme so a later supplied design can become the only visual source of truth.

## Context

The public route has accumulated two visual directions. Earlier specifications describe Cyber Noir and Data Prism styling, while the engineer now wants to choose a new design later. Keeping either direction in the code creates a mixed result and makes the next design harder to implement faithfully.

The web app already owns a stable public read path. It receives published content through the existing API boundary and posts contact messages through the same origin API route. This reset must not change those contracts or add data, API, configuration, or third party dependencies.

## Requirements

**User stories**:

- As a visitor, I want the portfolio to remain readable and usable while its visual design is being replaced.
- As the owner, I want a blank visual baseline so the next approved design can be implemented without inherited theme rules.

**Acceptance criteria**:

- **AC-1**: `/` renders the published profile and all nonempty published portfolio sections with plain semantic HTML and no branded visual theme.
- **AC-2**: The reset removes the terminal, Cyber Noir, and Data Prism presentation rules from the rendered route, including decorative effects, themed labels, themed motion controls, and theme specific page copy.
- **AC-3**: The existing portfolio API read, safe external URL handling, section visibility rules, contact form submission, loading state, unavailable state, metadata, JSON LD, and sitemap behavior remain unchanged.
- **AC-4**: The reset preserves a fixed accessible navigation with the current section anchors. It remains keyboard reachable and continues to hide while scrolling down and return while scrolling up or at the top.
- **AC-5**: The plain baseline remains responsive, has one page heading, preserves landmarks and labels, supports visible focus, and does not create horizontal overflow at supported viewport widths.
- **AC-6**: Automated tests no longer assert terminal or Data Prism effects. They assert the plain public baseline and the preserved functional contracts.

## Options considered

### Option 1: Keep the current Data Prism styling

Continue from the last theme and adjust it after the next design arrives.

**Pros**:

- No temporary visual reset work.

**Cons**:

- The next design inherits decisions the engineer explicitly rejected.
- Old effects and copy can survive unnoticed.

### Option 2: Plain semantic reset

Remove authored visual styling while retaining the working route and its behavior.

**Pros**:

- Creates an unambiguous baseline for the next design.
- Keeps the public route usable and testable.

**Cons**:

- The site is intentionally visually minimal until the new design ships.

### Option 3: Temporarily remove the public route

Return a blank page or a maintenance screen until the next design is built.

**Pros**:

- No interim presentation remains.

**Cons**:

- Removes the public portfolio and contact path.

## Decision

**Chosen option**: Option 2: Plain semantic reset.

Remove the visual system directly in `apps/web`, while keeping the existing route, server data read, contact mutation, and discoverability contracts.

**Implementation skills**: `architect` (`Portfolio`, `.agents/skills/architect/`) · `develop` (`Portfolio`, `.agents/skills/develop/`)

## Rationale

The public route is small and its behavior is already separated from presentation. A direct visual replacement is safer and clearer than retaining a rejected theme or taking the portfolio offline. No data migration or gradual traffic migration is needed because this change does not alter persisted data, API routes, or external integrations.

## Feature design

**Data model sketch**:

No data model change. The page continues to consume the existing `PortfolioPayload` from the public API.

**API surface**:

No API surface change. The existing `GET /portfolio` read and `POST /contact` mutation remain the page boundaries.

**Value sourcing**:

| Action                | Value displayed                          | Source                                         |
| --------------------- | ---------------------------------------- | ---------------------------------------------- |
| Render portfolio      | Profile and published sections           | Existing `GET /portfolio` response             |
| Render optional media | Safe external image and link URLs        | Existing web URL validation helper             |
| Submit contact        | Visitor form values and response state   | Existing `/api/contact` route and contact form |
| Render metadata       | Profile name, biography, and safe avatar | Existing server side portfolio read            |

**Key invariants**:

- The web app does not access Prisma, Neon, or PostgreSQL directly.
- Empty optional sections and their navigation links remain hidden.
- No theme specific copy, visual effect, or style selector remains in the rendered public route.
- The next visual design must be supplied and approved before themed presentation is added again.

**Security model**:

The route remains public read only. Contact submission keeps its existing validation, honeypot, idempotency, and rate limit protections in the API.

**Critical test scenarios**:

- Published content with populated and empty sections renders semantically, verifies **AC-1**, **AC-3**.
- The route contains no old theme effects or controls, verifies **AC-2**.
- Keyboard navigation, fixed navigation, narrow viewport, and visible focus remain usable, verifies **AC-4**, **AC-5**.
- Contact submission, metadata, sitemap, unavailable state, and URL safety tests continue to pass, verifies **AC-3**, **AC-6**.

## Build plan

1. Replace the public route page structure and global page styles with a small semantic baseline. Remove decorative effect components and visual theme assets from the route, satisfies **AC-1**, **AC-2**.
2. Keep the navigation, profile, optional sections, contact form, loading and unavailable boundaries working with neutral presentation, satisfies **AC-3**, **AC-4**, **AC-5**.
3. Replace design specific browser tests with tests for the neutral route and preserved functional behavior, satisfies **AC-6**.
4. Run format, lint, typecheck, unit tests, production build, and browser tests before the new design work begins, satisfies **AC-1** through **AC-6**.

## Consequences

**Positive**:

- The next design starts from one clear baseline.
- Portfolio behavior remains available during the design transition.

**Negative / tradeoffs**:

- The public page is deliberately minimal until the new design is approved and implemented.
- Existing screenshot oriented UI checks must be rewritten.

**Neutral**:

- Earlier home page and about section specifications still govern content and API behavior. Their visual directives are replaced by this specification.

## Follow-up

- [ ] Provide the next approved design source before rebuilding presentation.
- [ ] Enroll the UI reset in the visitor scope if it will be tracked as a separate delivery slice.

## Migration plan

**Strategy**: no migration needed

**Phases**:

1. Remove the theme from the public web route and update its tests.
2. Build the next approved design on the neutral baseline.

**Rollback**: revert the UI reset commit. No data or API rollback is required.

**Risks**: a reset can accidentally remove an accessibility or functional behavior. The existing browser and unit tests must cover those contracts before the next design begins.
