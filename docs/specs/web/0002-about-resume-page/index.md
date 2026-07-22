# 0002. About and Resume Sections

**Date**: 2026-07-21
**Status**: In Progress

## Summary

The home page gives hiring managers a clear career timeline and a direct way to open the current resume. It reuses the existing public portfolio API and the Stitch Data Prism interface. There is no separate About page or route. The fixed navigation shows the available home sections, hides while scrolling down, and returns while scrolling up.

## Requirements

**User stories**:

- As a hiring manager, I want to scan experience, education, certifications, and skills in one place so that I can understand Mark's background quickly.
- As a visitor, I want to open the current resume in a new tab so that I can keep the portfolio available while reviewing it.

**Acceptance criteria**:

- **AC-1**: `/` renders the published profile identity and separate Projects, Experience, Skills, Education, Certification, Services, and Contact sections when data exists.
- **AC-2**: The home page uses the Stitch Data Prism design system, with yellow, orange, amber, and green spectrum accents, and one shared navigation bar.
- **AC-3**: Only published records render. The API orders records by `displayOrder`, then `createdAt`, then `id`, and the web boundary preserves that order.
- **AC-4**: Empty sections and their navigation links are hidden. The navigation includes Root, Projects, Experience, Skills, Education, Certification, Services, and Connect in that order.
- **AC-5**: The resume action is hidden when no resume URL exists. A safe HTTPS resume URL opens in a new tab with `noopener` and `noreferrer`.
- **AC-6**: An invalid optional media or credential URL is normalized to `null`, hiding only that affected link or image while preserving the record. Resume and credential links require absolute HTTPS URLs in every environment.
- **AC-7**: Dates use deterministic English labels such as `Jan 2024`, `2022`, and `Present` for current records. Required months must be `YYYY-MM` with a month from `01` through `12`, and required years must be integers. Malformed required dates use the unavailable state.
- **AC-8**: An unpublished profile uses the existing not found page on `/`.
- **AC-9**: Loading, timeout, malformed data, and server failures use the existing loading and unavailable states with Try Again.
- **AC-10**: The page collapses to one column on small screens and keeps semantic landmarks, one page heading, section headings, visible focus, keyboard access, and accessible date text.
- **AC-11**: `/` emits the existing title, description, canonical URL, sitemap entry, and Person JSON LD URL.
- **AC-12**: The page is server rendered, uses the existing data boundary, and loads every published record in one response without a client store cache. The API does not cap these collections at 100 rows.
- **AC-13**: The shared navigation is fixed while visible, hides when scrolling down, returns when scrolling up, and remains keyboard accessible.

## Decision

**Chosen option**: Keep the career and resume content on the existing home route and reuse the existing `/portfolio` read path and server rendered web boundary.

The home page will use the existing profile, project, experience, education, certification, skill, and service records, with one shared prism navigation component, scroll direction behavior, geometric cards, unavailable state, metadata, sitemap, and safe URL and date helpers. No `/about` route, schema migration, new endpoint, authentication system, or package is required.

**Implementation skills**: `architect` (`local`, `.agents/skills/architect/`) · `develop` (`local`, `.agents/skills/develop/`) · `test` (`local`, `.agents/skills/test/`) · `check` (`local`, `.agents/skills/check/`)

## Feature design

**Data model sketch**:

| Entity        | Required fields                                                              | Optional fields and constraints                                                 |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Profile       | singleton `name`, `biography`, `contactEmail`, `published`                   | `avatarUrl`, `phoneNumber`, `resumeUrl`; only the published singleton is public |
| Experience    | `company`, `role`, `startMonth`, `current`, `displayOrder`, `published`      | `location`, `endMonth`, `description`; current records cannot have `endMonth`   |
| Education     | `institution`, `degree`, `startYear`, `current`, `displayOrder`, `published` | `location`, `endYear`; current records cannot have `endYear`                    |
| Certification | `name`, `issuingOrganization`, `issueYear`, `displayOrder`, `published`      | `credentialUrl`                                                                 |
| Skill         | `name`, `displayOrder`, `published`                                          | `iconUrl`                                                                       |

All entities are global records with no profile foreign key, matching the existing schema. The API applies deterministic ordering by `displayOrder`, `createdAt`, then `id` and returns every published row without a collection cap. Database constraints reject negative display orders and invalid current or end value combinations.

**API surface**:

| Endpoint     | Method | Key inputs | Key outputs                                                                                 | Auth   | Key errors                                                          |
| ------------ | ------ | ---------- | ------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `/portfolio` | GET    | none       | Published profile, experience, education, certifications, skills, and existing project data | Public | 404 unpublished or missing profile, 429 rate limit, 5xx unavailable |

The About page adds no API endpoint. It consumes the existing response through `apps/web/src/lib/portfolio.ts`.

**Value sourcing**:

| Action                | Value produced or displayed                                    | Source                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render identity       | Name, biography, avatar, contact action                        | Published `Profile.name`, `Profile.biography`, and `Profile.avatarUrl` from `/portfolio`; contact remains the existing form route                                         |
| Render experience     | Company, role, location, description, date range               | Published `Experience` columns, formatted by the date helper                                                                                                              |
| Render education      | Institution, degree, location, date range                      | Published `Education` columns, formatted by the date helper                                                                                                               |
| Render certifications | Name, issuer, issue year, credential action                    | Published `Certification` columns and safe `credentialUrl` validation                                                                                                     |
| Render skills         | Name and optional icon                                         | Published `Skill` columns and safe `iconUrl` validation                                                                                                                   |
| Render resume action  | New tab link                                                   | `Profile.resumeUrl`, accepted only when it is an absolute HTTPS URL                                                                                                       |
| Render navigation     | `/about` link in desktop and mobile navigation                 | The available `/about` route and the reusable navigation component decided in this spec                                                                                   |
| Render metadata       | Home title and description, `/about` canonical, Person JSON LD | Existing home metadata values, normalized `NEXT_PUBLIC_SITE_URL`, `/about`, and published profile fields; JSON LD excludes contact email and phone and safely escapes `<` |
| Render sitemap        | `/about` URL                                                   | `sitemap.ts` and the normalized `NEXT_PUBLIC_SITE_URL` origin                                                                                                             |
| Render errors         | Loading, unavailable, or not found surfaces                    | Existing web loading, error, and not found components                                                                                                                     |

**Key invariants**:

- The web app never reads the database directly.
- The API returns only published public records.
- The API orders every public collection and does not cap the About collections at 100 rows.
- Optional invalid URLs do not remove their parent record.
- Resume and credential links use safe absolute HTTPS URLs and open in a new tab without an opener.
- Display ordering is stable across requests.
- The page has one `h1`, semantic sections, labels, focus states, and accessible date text.

**Security model**:

The page is public read only. No visitor can write portfolio records. The API owns publication filtering and validation. The web boundary validates response shape and external URLs before rendering. Contact email and phone remain in the existing contact flow and are excluded from About markup and Person JSON LD.

**Configuration required**:

No new environment variables or third party credentials are required. Existing `API_INTERNAL_URL` and `NEXT_PUBLIC_SITE_URL` behavior remains in force.

**Critical test scenarios**:

- Happy path: render a populated published profile with all four sections, deterministic dates, resume action, metadata, and About navigation, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-7**, **AC-11**, **AC-12**, **AC-13**
- Empty and invalid data: hide empty sections, invalid media links, and a missing resume while preserving valid records, verifies **AC-4**, **AC-5**, **AC-6**
- Failure case: show existing loading, unavailable, Try Again, and not found surfaces for timeout, malformed response, server failure, and unpublished profile, verifies **AC-8**, **AC-9**
- Accessibility and responsive behavior: verify landmarks, headings, keyboard focus, narrow viewport layout, and accessible date text, verifies **AC-10**

## Build plan

1. Update the API read queries and DTO boundary to order by `displayOrder`, `createdAt`, then `id`, remove the `take: 100` cap, normalize invalid optional URLs, and reject malformed required dates, satisfies **AC-3**, **AC-6**, **AC-7**, **AC-12**.
2. Extract one shared home navigation component with ordered section links and scroll direction visibility, remove the `/about` route, and keep home metadata and sitemap behavior, satisfies **AC-8**, **AC-11**, **AC-13**.
3. Add the complete home page journey using Data Prism section shells, geometric cards, identity header, projects, experience signal path, education, certifications, skills, services, contact, and resume action, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
4. Add responsive and accessibility hardening for one column mobile layout, semantic headings, focus states, keyboard behavior, safe external links, privacy exclusions, and readable date text, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-10**.
5. Add Vitest and Playwright coverage for populated, empty, invalid, unpublished, failing, metadata, responsive, and accessibility scenarios, then run format, lint, typecheck, unit, build, and end to end gates, satisfies **AC-1** through **AC-13**.

## Consequences

**Positive**:

- Hiring managers get a focused career and resume path without changing the API contract.
- Existing validation, rate limiting, error surfaces, design tokens, and test infrastructure are reused.
- Server rendering keeps the first view simple and avoids a client data store.

**Negative / tradeoffs**:

- The single response grows as more records are published, although the approved dataset is small.
- Global records remain coupled to one public portfolio because no profile relationship is introduced.
- A separate About route duplicates some metadata and navigation wiring that must stay consistent with home.

**Neutral**:

- Resume hosting, credential hosting, and media availability remain external concerns.
- Owner editing and authentication are intentionally outside this slice.

## Follow-up

- [ ] Design owner editing and authentication before adding an admin or CMS surface.
- [ ] Revisit profile relationships if the product supports multiple portfolio owners.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
