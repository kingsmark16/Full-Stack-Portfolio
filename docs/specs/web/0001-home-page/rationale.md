## Context

The connected skeleton already reads portfolio content and renders a Cyber Noir public shell. The next visitor slice needs to turn that shell into a useful first impression for hiring managers and clients while keeping dashboard managed content current.

The page has no new persistence requirement. Its main design choices are the visitor flow, section boundaries, freshness policy, and failure behavior.

## Options considered

### One page with anchor navigation

Hero, projects, skills, services, and contact live in one server rendered journey. This keeps the path easy to scan and works with the existing design. The tradeoff is a longer page as content grows.

### Route first portfolio

Each content group receives a separate route immediately. This improves deep linking but adds navigation, loading, and SEO surfaces before the first visitor journey is complete.

### Client fetched dashboard style page

The browser fetches and assembles the page after hydration. This can support richer interaction but weakens first render and search visibility and duplicates server state handling.

## Rationale

The one page approach best matches the Journey build approach and the current product goal. Anchor navigation gives visitors a predictable path, while the existing public DTO already supplies the required content. A fresh server read keeps the page aligned with dashboard publication without adding cache invalidation or another API contract.

The page fails closed when the public read is unavailable or invalid. That protects visitors from misleading partial content and reuses the existing retry state. The Cyber Noir effects remain decorative and user controlled so visual identity does not compete with the portfolio evidence.
