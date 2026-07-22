# About and Resume Page Verification

Run these checks after implementation. Each check maps to the contract in `index.md`.

1. Start the API and web applications with the normal workspace development command, then open `/about`, verifies **AC-1**, **AC-2**, **AC-12**.
2. Seed a published profile with experience, education, certifications, skills, and a valid HTTPS resume URL. Confirm all sections, dates, and the new tab resume action, verifies **AC-1**, **AC-3**, **AC-5**, **AC-7**, **AC-13**.
3. Remove records one section at a time and remove the resume URL. Confirm empty sections, links, and the resume action disappear without affecting other content, verifies **AC-4**, **AC-5**.
4. Set one optional media or credential URL to an unsafe or malformed value. Confirm only that image or link is hidden and the record remains, verifies **AC-6**.
5. Mark the profile unpublished or stop the API. Confirm the existing not found, loading, unavailable, and Try Again surfaces, verifies **AC-8**, **AC-9**.
6. Inspect page source for the home title and description, an `/about` canonical, and Person JSON LD pointing to `/about`, verifies **AC-11**.
7. Test keyboard navigation and a narrow viewport. Confirm one `h1`, semantic sections, visible focus, readable dates, and one column layout, verifies **AC-10**.
8. Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`, verifies **AC-1** through **AC-13**.
9. Seed more than 100 published records and confirm all render in API order, verifies **AC-3** and **AC-12**.
10. Inspect About markup and JSON LD to confirm contact email and phone are absent, and inspect `/sitemap.xml` for the normalized `/about` URL, verifies **AC-11** and **AC-13**.
