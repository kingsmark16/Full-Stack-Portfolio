# Web application

## Overview

This workspace is the Next.js App Router site. It serves public portfolio pages now and will later contain the owner dashboard.

## Key files

| File             | Owns                                           |
| ---------------- | ---------------------------------------------- |
| `src/app/`       | App Router pages, layouts, and route level UI. |
| `next.config.ts` | Same origin API rewrites through `/api`.       |
| `package.json`   | Web workspace commands and dependencies.       |

## Commands

```powershell
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web test:e2e
```

## Conventions

- Follow the root [AGENTS.md](../../AGENTS.md) rules.
- Use Server Components for public reads. Use TanStack Query only for later interactive dashboard reads and mutations.
- Access API data through `/api` in browser code. Do not access the database directly from this workspace.
- Keep shared UI state separate from server data. Zustand is only for UI state when it spans components.
- Use Zod for web forms and configuration validation when those features are added.
- Design system: build all UI to `design.md` (art direction and the maximalist product bar); token values live in CSS.

## Gotchas

`next.config.ts` sends `/api` requests to `API_INTERNAL_URL`, or to local API port `3001` when it is unset. Do not add browser to API CORS work for this same origin route.

## Related specs

[Spec 0001](../../docs/specs/0001-stack-architecture/index.md)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
