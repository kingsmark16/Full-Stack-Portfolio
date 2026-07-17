# Public portfolio read

## Summary

The public page reads one portfolio snapshot from NestJS. The API returns only published content and the web application renders it on the server. Empty, loading, and failure states are deliberate parts of the visitor journey.

## Decision

Use `GET /portfolio` in NestJS, reached by the browser through `/api/portfolio`. Return one JSON object with `profile`, `skills`, `experience`, `education`, `certifications`, `services`, and `projects`. This is one bounded portfolio document, so it does not paginate. Each public section query caps at 100 records.

## API surface

| Endpoint     | Method | Inputs | Outputs                                     | Auth   | Key errors                                                                             |
| ------------ | ------ | ------ | ------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `/portfolio` | GET    | None   | published Profile and ordered public arrays | public | `404` when Profile is not published, `429` when rate limited, `500` dependency failure |

## Value sourcing

| Action                    | Value                                    | Source                                                                          |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Public read               | Profile                                  | published Profile row with `singletonKey` set to `default`                      |
| Public read               | Skills                                   | published Skill rows ordered by `displayOrder`, then `createdAt`                |
| Public read               | Experience                               | published Experience rows ordered by `displayOrder`, then `createdAt`           |
| Public read               | Education                                | published Education rows ordered by `displayOrder`, then `createdAt`            |
| Public read               | Certifications                           | published Certification rows ordered by `displayOrder`, then `createdAt`        |
| Public read               | Services                                 | published Service rows ordered by `displayOrder`, then `createdAt`              |
| Public read               | Projects and technologies                | published Project rows and related published Skill rows through ProjectSkill    |
| Page title                | page metadata title                      | Profile name followed by `Portfolio`                                            |
| Page description          | page metadata and Open Graph description | first 160 characters of normalized Profile biography                            |
| Canonical URL and sitemap | public page address                      | existing `WEB_ORIGIN` plus `/`                                                  |
| Open Graph image          | social image                             | Profile avatar URL when valid, otherwise the project owned default social image |

## Web behavior

1. Use a Next.js Server Component to fetch the API through `API_INTERNAL_URL`.
2. Use the `portfolio` cache tag with a 60 second fallback lifetime.
3. Set an API fetch timeout of five seconds.
4. Hide a section whose response array is empty.
5. Show a section shaped loading state during navigation.
6. Show a friendly error state with a client retry button that calls `router.refresh()` when the API request fails or times out.
7. Return a not found page when the API returns `404` for an unpublished Profile.
8. Add title and description metadata, canonical URL, Open Graph metadata, and sitemap inclusion.

## Public data transfer fields

1. Profile exposes name, biography, avatar URL, contact email, phone number, and resume URL.
2. Skill exposes name and icon URL.
3. Experience exposes company, role, location, dates, current flag, and description.
4. Education exposes institution, degree, location, years, and current flag.
5. Certification exposes name, issuing organization, issue year, and credential URL.
6. Service exposes name, description, and icon URL.
7. Project exposes title, slug, description, URLs, dates, and related public Skills.
8. Public data transfer objects exclude database IDs, timestamps, `displayOrder`, `published`, and all ContactMessage fields.

## Security and limits

1. The route is explicitly public under the private by default API posture.
2. It returns no ContactMessage data and no unpublished record.
3. Limit requests to 60 per minute per IP.
4. Return `application/problem+json` with `type`, `title`, `status`, `detail`, application `code`, and `requestId`. Use `PORTFOLIO_NOT_PUBLISHED` for `404`, `RATE_LIMITED` for `429`, and `PORTFOLIO_UNAVAILABLE` for internal failure.
5. Signed `portfolio` tag revalidation follows the existing application platform decision after a future content mutation succeeds. It is not invoked by public reads.
