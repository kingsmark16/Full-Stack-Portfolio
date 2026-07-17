# Portfolio content

**Status**: Proposed

## Summary

This decision defines the portfolio content that the owner can manage and visitors can read. PostgreSQL holds structured records, NestJS owns all data access, and Next.js renders the public page from the API. Contact messages are saved privately and sent to the owner by email.

## Structure

1. [Content model](0002-model.md), entities, fields, relationships, and data rules.
2. [Public read](0002-public-read.md), the published portfolio response and public page behavior.
3. [Contact form](0002-contact-form.md), private message storage and email notification.

## Requirements

1. **AC-1**: The database supports one Profile, Skills, Experience, Education, Certifications, Services, Projects, project to Skill links, private ContactMessages, and durable ContactEmailOutbox events with the fields and constraints in the content model.
2. **AC-2**: `GET /portfolio` returns one published Profile and published Skills, Experience, Education, Certifications, Services, and Projects, ordered by `displayOrder` then creation time. It returns empty arrays for empty sections and returns a `404` Problem Details response when the Profile is not published.
3. **AC-3**: The public Next.js page is server rendered from `GET /portfolio`, hides empty sections, shows a section shaped loading state during navigation, and shows a friendly retry state when the API cannot serve the page.
4. **AC-4**: The public page has title and description metadata, a canonical URL, Open Graph metadata, and sitemap inclusion.
5. **AC-5**: `POST /contact` validates, saves, and queues the exact visitor message for email delivery to the owner, then returns `202 Accepted`. Repeated requests with the same idempotency key create no duplicate message or email.
6. **AC-6**: Contact messages are private to the authenticated owner. Public reads return only published content. Public read traffic is limited to 60 requests per minute per IP. Contact submissions are limited to 5 per hour per IP and use a honeypot field.

## Decision

**Chosen option**: One relational portfolio model, one combined public read endpoint, and one private contact message flow.

**Implementation skills**: None beyond the repository workflow skills.

NestJS owns Prisma, PostgreSQL access, validation, OpenAPI, public rate limits, and email queueing. Next.js reads through the API only. The first public page uses one server request for a consistent content snapshot. The Journey build approach completes this visitor path before dashboard editing screens.

## Feature design

**Cross child contract**:

1. Every public content entity has a UUID, creation time, update time, a nonnegative `displayOrder`, and `published` defaulting to false, except Profile which is a published singleton.
2. Public reads use the `portfolio` cache tag with a 60 second fallback lifetime.
3. Successful future content mutations request signed revalidation using the existing platform contract.
4. NestJS returns `application/problem+json` failures with stable application code and request identifier. It never exposes private ContactMessages through public routes.
5. The web application has no direct database access.

**Data model sketch**:

1. Profile is one published singleton.
2. Skill, Experience, Education, Certification, Service, and Project are independently ordered public records.
3. Project and Skill use a many to many relationship through ProjectSkill.
4. ContactMessage is private data with `new`, `read`, and `archived` states. ContactEmailOutbox is private delivery state.
5. Full fields, nullability, and constraints are in [Content model](0002-model.md).

**State transitions**:

1. Public content moves from unpublished to published and back to unpublished.
2. ContactMessage moves from new to read to archived.

**API surface**:

| Endpoint     | Method | Key inputs                                      | Key outputs                                 | Auth   | Key errors          |
| ------------ | ------ | ----------------------------------------------- | ------------------------------------------- | ------ | ------------------- |
| `/portfolio` | GET    | None                                            | published Profile and public content arrays | public | `404`, `429`, `500` |
| `/contact`   | POST   | name, email, message, honeypot, idempotency key | `202 Accepted`                              | public | `422`, `429`, `500` |

**Value sourcing**:

| Action             | Value produced or displayed       | Source                                                                |
| ------------------ | --------------------------------- | --------------------------------------------------------------------- |
| Public read        | Profile and public content arrays | published PostgreSQL rows, ordered by `displayOrder` then `createdAt` |
| Public read        | Project technologies              | related published Skill rows through ProjectSkill                     |
| Contact submission | message record                    | validated name, email, and message from the request body              |
| Contact submission | message time                      | API clock at transaction commit                                       |
| Contact submission | duplicate protection              | unique idempotency key from the request header                        |
| Contact email      | owner recipient                   | existing server only Resend configuration                             |
| Contact email      | reply address                     | validated visitor email from the request body                         |

**Key invariants**:

1. The database contains at most one Profile.
2. Public responses never include unpublished content or ContactMessages.
3. Project slugs and project to Skill pairs are unique.
4. Current Experience and Education entries have no end value. Completed entries require one.
5. The email outbox record and ContactMessage save in one transaction.
6. A Profile row must use the only allowed `singletonKey` value, `default`.

**Security model**:

1. Both public routes are explicit exceptions to the private by default API posture.
2. Only the authenticated owner can later read or manage ContactMessages.
3. Public route limits use a validated client IP derived through the configured trusted proxy hops. The first release is one API instance and uses local throttle storage. Scaling beyond one instance requires a shared rate limit store before increasing replicas.
4. Public route limits and the contact honeypot protect against simple abuse.

**Configuration required**:

1. `CONTACT_RECIPIENT_EMAIL`: the owner Gmail address that receives contact notifications.
2. `TRUST_PROXY_HOPS`: trusted reverse proxy hops for client IP resolution. Use `0` locally and the approved hosting value in deployed environments.
3. `RESEND_API_KEY` and `EMAIL_FROM`: existing server only values for contact delivery.

**Critical test scenarios**:

1. Happy path: published content is stored, returned by `GET /portfolio`, and rendered by the public page, verifies **AC-1**, **AC-2**, and **AC-3**.
2. Failure case: an unpublished Profile returns `404`, and an API timeout after five seconds shows the public retry state, verifies **AC-2** and **AC-3**.
3. Security: unpublished records and ContactMessages do not appear in public reads, verifies **AC-6**.
4. Contact: a valid submission saves the record and queues one email, repeated idempotency keys do not duplicate it, and a filled honeypot returns `202` without saving or queueing, verifies **AC-5** and **AC-6**.

## Build plan

1. Create the Prisma schema and migration for the confirmed content model, including indexes and database constraints, satisfies **AC-1**.
2. Build the public portfolio query, controller, DTOs, OpenAPI contract, and rate limit, satisfies **AC-2** and **AC-6**.
3. Build the server rendered Next.js public page with loading, empty, error, and SEO behavior, satisfies **AC-3** and **AC-4**.
4. Build contact validation, idempotency, message persistence, outbox notification, and abuse controls, satisfies **AC-5** and **AC-6**.
5. Add unit, API integration, and browser tests for the visitor and contact journeys, satisfies **AC-1** through **AC-6**.

## Consequences

**Positive**:

1. The dashboard can manage structured portfolio content without changing the public read contract.
2. Visitors receive one consistent and cacheable portfolio response.
3. Contact messages survive a temporary email delivery failure.

**Negative and tradeoffs**:

1. The initial migration has more entities than the first page displays.
2. The contact flow requires Resend configuration and outbox processing before it can notify the owner.
3. Indefinite message retention requires the owner to manage deletion responsibly.

**Neutral**:

1. Education, certifications, and services are ready for later public sections even if the first page introduces them gradually.

## Follow up

1. Design owner authentication and dashboard authorization before implementing private ContactMessage views or content management.
2. Decide media asset management when file uploads replace the current URL fields.
3. Add a shared rate limit store before running more than one API instance.

## Rationale

Reasoning and options are in [rationale.md](rationale.md).
