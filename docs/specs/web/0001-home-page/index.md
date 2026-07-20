**Status**: In Progress

## Summary

The home page is one complete visitor journey for hiring managers and clients. It keeps the Cyber Noir Terminal design, reads fresh published content from the existing portfolio API, and uses anchor navigation from the hero through projects, skills, services, and contact. It adds no new database model or API route.

## Context

The connected portfolio skeleton already proves the API and public site boundary, but the home page needs a clear content order and behavior before implementation. The page must stay current when dashboard content changes, remain readable when data is empty or unavailable, and preserve the existing accessible motion and contact patterns.

The page belongs to the `apps/web` workspace. The API remains the owner of persistence, publication rules, validation, and contact behavior. The page reads through `/api` and never accesses Prisma or Neon directly.

## Requirements

- **AC-1** The hero shows the fixed role label `Full stack developer`, the published profile name, and the published biography. Its primary action targets the projects anchor.
- **AC-2** The page presents sections in this order: hero, projects, skills, services, and contact. Navigation uses same page anchors for `#projects`, `#skills`, `#services`, and `#contact`.
- **AC-3** The projects section shows at most five published projects in the deterministic order supplied by `GET /portfolio`. The API order is `displayOrder` ascending, then `createdAt` ascending. It hides when no published projects exist, and its navigation link is hidden with it.
- **AC-4** The skills and services sections show every published record in the deterministic API order of `displayOrder` ascending, then `createdAt` ascending. Each section and its navigation link hide when it has no published records.
- **AC-5** API media URLs are rendered when present. A missing profile avatar uses an accessible initials or terminal glyph fallback. The contact section embeds the existing contact form and keeps its validation, success, error, and idempotency behavior.
- **AC-6** The page uses streamed server rendering with the route loading UI while the server read is pending. A missing profile, network failure, timeout, 429, 5xx, malformed JSON, or schema validation failure shows the Cyber Noir error state with a working Try Again action. A valid profile with empty optional sections still renders normally.
- **AC-7** The layout remains usable on narrow screens as a single column. It uses `header`, `nav`, `main`, and `footer`, one `h1`, section `h2` headings, visible focus styles, and native anchor navigation. Decorative terminal effects start automatically, remain behind content, provide `Pause terminal effects` and `Resume terminal effects` controls, and start paused when reduced motion is requested.
- **AC-8** The page emits dynamic metadata from the published profile. The title is `<name> | Full Stack Developer` and the description is the biography normalized to one line and limited to 160 characters. Missing profile data uses `Mark Angel | Full Stack Developer` and `Full stack developer building useful web experiences.`. The page emits a canonical URL, Person JSON LD with `name`, `url`, `image`, `jobTitle`, and `description`, and an Open Graph image using the profile avatar or `og-default.svg`.

## Decision

Build the home page as a server rendered, single page visitor journey. Reuse the existing `GET /portfolio` read path, existing contact form, terminal effects, loading state, retry state, and CSS tokens. Add focused section components rather than one large component or a new shared package.

The public page receives only published fields from the API. It fetches without a cache so dashboard changes become visible immediately. The browser uses the same origin `/api` rewrite, and no browser to API CORS configuration is added.

## Feature design

**Data model sketch**:

No new tables or migrations are required. The page consumes the existing public projection:

- `Profile`: the public DTO contains required `name`, `biography`, and `contactEmail`, plus nullable `avatarUrl`, `phoneNumber`, and `resumeUrl`. The API selects the singleton profile with `singletonKey = default` and `published = true`. Zero records returns 404. The database unique key prevents multiple default profiles.
- `Project`: the public DTO contains `title`, `slug`, `description`, nullable `imageUrl`, `projectUrl`, `repositoryUrl`, `startMonth`, and `endMonth`, plus nested published skills. The API returns published projects ordered by `displayOrder` and `createdAt`; the page takes the first five without client side reordering.
- `Skill`: the public DTO contains `name` and nullable `iconUrl`. The API returns published skills ordered by `displayOrder` and `createdAt`.
- `Service`: the public DTO contains `name`, `description`, and nullable `iconUrl`. The API returns published services ordered by `displayOrder` and `createdAt`.
- `ContactMessage`: written only through the existing contact form endpoint. It is not exposed by the public read response.

**API surface**:

| Endpoint         | Method | Key inputs                            | Key outputs                                                                                              | Auth   | Key errors                                                 |
| ---------------- | ------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `/api/portfolio` | GET    | none                                  | public profile DTO, ordered published projects with nested skills, ordered published skills and services | public | 404 unavailable, 429 rate limit, 5xx upstream failure      |
| `/api/contact`   | POST   | existing contact DTO, idempotency key | accepted status and message identifier                                                                   | public | 400 or 422 invalid, 409 duplicate conflict, 429 rate limit |

The home page adds no endpoint. The Next.js rewrite forwards both paths to the NestJS API.

**Value sourcing**:

| Action                           | Value produced or displayed                                     | Source                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Render hero                      | role label                                                      | fixed copy in this spec                                                                                                       |
| Render hero                      | profile name and biography                                      | `Profile.name` and `Profile.biography` from `GET /portfolio`                                                                  |
| Render projects                  | first five project title, description, links, image, and skills | first five items in the ordered published `Project` projection and its ordered nested skills                                  |
| Render skills                    | skill name and icon                                             | published `Skill` projection ordered by API                                                                                   |
| Render services                  | service name, description, and icon                             | published `Service` projection ordered by API                                                                                 |
| Render avatar                    | avatar image                                                    | `Profile.avatarUrl`, or initials and terminal glyph derived from `Profile.name`                                               |
| Render contact                   | submitted visitor fields and response state                     | existing contact form and `POST /contact`                                                                                     |
| Render metadata                  | title and description                                           | published profile name and biography formulas in AC-8, or the exact static fallback strings in AC-8                           |
| Render canonical and social URLs | absolute home page URL                                          | normalized `NEXT_PUBLIC_SITE_URL`, required in production and defaulting to `http://localhost:3000` only in local development |
| Render Person JSON LD            | name, URL, image, job title, and description                    | profile name, canonical URL, resolved Open Graph image URL, fixed `Full Stack Developer`, and the metadata description        |
| Render Open Graph image          | profile image or default terminal artwork                       | `Profile.avatarUrl`, or absolute `${NEXT_PUBLIC_SITE_URL}/og-default.svg`                                                     |

**Key invariants**:

- Only published profile, project, skill, and service records can reach the page.
- Projects are limited to five after API ordering, never five arbitrary client side records.
- The page does not expose contact messages, private owner data, or database errors.
- Invalid or incomplete portfolio payloads fail closed into the error state.
- External media and project links accept only absolute `https` URLs in production. `http` is allowed only in local development. External links open in a new tab with `rel="noreferrer"`.
- Profile, project, and service descriptions are plain text and are never rendered as HTML or Markdown.
- Decorative effects never obscure or replace meaningful content.

**Security model**:

Portfolio reads are public and rate limited. The API owns publication filtering and returns a public DTO only. Contact writes use the existing validation, honeypot, idempotency, and rate limit controls. No authentication is needed for this visitor page, and no owner data is added to the browser response.

**Configuration required**:

- `NEXT_PUBLIC_SITE_URL`: absolute public origin used for canonical metadata, JSON LD, and social URLs. It is required in production and falls back to `http://localhost:3000` only in local development. Trailing slashes are removed.

**Critical test scenarios**:

- Happy path: a populated API response renders the hero, five or fewer projects, all published skills and services, media, anchors, and contact form, verifying **AC-1**, **AC-2**, **AC-3**, **AC-4**, and **AC-5**.
- Failure case: an unavailable or malformed API response renders the loading and error states and the Try Again action, verifying **AC-6**.
- Accessibility and resilience: reduced motion, keyboard navigation, narrow viewport, missing avatar, and disabled WebGL keep the page readable, verifying **AC-5** and **AC-7**.
- SEO: metadata, canonical URL, Person JSON LD, and Open Graph fallback are emitted from configured and fallback sources, verifying **AC-8**.

## Build plan

The Journey approach is applied as one visitor path. Each task keeps the page usable end to end before adding the next layer.

1. [x] Wire the server page to the existing public portfolio DTO, `cache: no-store` fetch policy, response validation, exact error matrix, and profile fallbacks, satisfying **AC-1**, **AC-5**, and **AC-6**.
2. [x] Build the anchored page composition and focused hero, projects, skills, services, and contact sections, satisfying **AC-2**, **AC-3**, **AC-4**, and **AC-5**.
3. [x] Apply the responsive Cyber Noir layout, accessible semantics, avatar and media fallbacks, and terminal motion controls, satisfying **AC-5** and **AC-7**.
4. [x] Add dynamic metadata formulas, production URL validation, canonical URL normalization, Person JSON LD, and Open Graph image fallback, satisfying **AC-8**.
5. Add unit, API contract, and Playwright coverage for populated, empty, unavailable, reduced motion, narrow viewport, navigation, and SEO behavior, satisfying **AC-1** through **AC-8**.

## Consequences

**Positive**:

- Visitors get one clear path from identity to proof to contact.
- Dashboard publication changes appear without rebuilding the web app.
- Existing API and design system investments are reused.
- The page remains accessible when effects, images, or optional content are unavailable.

**Negative and tradeoffs**:

- Fresh server reads increase API traffic compared with cached rendering.
- A single long page may become crowded as more content is published.
- The first home page release depends on the existing API being available.
- A dynamic social image based on an arbitrary avatar URL may need a later image proxy if providers reject remote image metadata.

**Neutral**:

- Project detail routes, filtering, and case studies remain separate visitor features.
- The dashboard is not part of this page build.

## Follow-up

- [ ] Add the home page spec link to the visitor scope row after confirmation.
- [ ] Revisit project detail links when the project case study feature is designed.

## Rationale

Reasoning and options are recorded in [rationale.md](rationale.md).
