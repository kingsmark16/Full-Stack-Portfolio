## Context

The portfolio needs a dedicated visitor path for career history and a current resume. The existing public API already returns the required profile and section records, and the home page already establishes the Cyber Noir Terminal visual language, loading states, URL validation, and quality gates.

The approved scope favors a small, public read path. The data set is expected to remain small, records are already publication controlled, and the current schema deliberately treats records as global rather than attaching them to a profile. The page must therefore add useful presentation without creating a second source of truth or a new operational dependency.

## Options considered

### Option 1: Reuse `/portfolio` and add `/about`

The web app consumes the existing response through the existing server boundary and renders a dedicated About route.

**Pros**:

- Smallest API and database change.
- Keeps publication rules and response validation in one place.
- Fits the existing Journey delivery approach and design system.

**Cons**:

- The response contains more data than the About page needs.
- Metadata and navigation must be kept consistent across two routes.

### Option 2: Add a dedicated `/about` API endpoint

The API would expose a narrower response tailored to the About page.

**Pros**:

- Clear endpoint ownership and smaller payload semantics.
- Allows About specific evolution later.

**Cons**:

- Duplicates public filtering, ordering, validation, and failure behavior.
- Adds API tests, route documentation, and another contract for a small data set.

### Option 3: Client side fetch with a shared store

The browser would fetch portfolio data after hydration and keep it in a client store.

**Pros**:

- Could share data between future interactive routes.
- Enables client driven refresh without a full navigation.

**Cons**:

- Adds loading complexity and exposes more of the data boundary to the browser.
- Weakens first render and metadata reliability for a public SEO page.
- Introduces state management before a measured need exists.

## Rationale

Option 1 is the right fit because the approved journey is public read only, the API already provides the required records, and the data set is intentionally small. Reusing the existing path keeps publication filtering, stable ordering, URL validation, and failure behavior consistent. A new endpoint would create maintenance cost without solving a current performance problem, while a client store would make the first render and SEO path more fragile.

The tradeoff is accepting a broader response and some route level duplication. That cost is explicit, bounded, and easier to operate than another API contract or state layer. If the product later gains multiple owners, large histories, or owner editing, those forces should trigger a new architecture decision rather than being hidden in this page.

The implementation must make the current API behavior explicit. Public collections cannot retain a 100 row cap when the contract says every published record, and tie breakers must be applied in the API because the web DTO does not expose database ordering fields. Optional URL parsing must degrade to `null` rather than reject an otherwise valid record. The page must also share navigation, unavailable UI, metadata helpers, and sitemap origin rules to prevent home and About behavior from drifting.
