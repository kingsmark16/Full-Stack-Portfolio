# Visitor journey

This journey is complete when a hiring manager can understand the owner, find relevant work, inspect evidence, download the current resume, and send a qualified message.

### 6. Home page · done

Give visitors a fast, credible introduction and clear routes to projects, services, background, and contact.
**Done when:** the page presents the owner's role, value, featured work, core skills, and calls to action from real API content; it handles responsive layout, loading, empty, and error states and meets the public quality targets.

- [x] Design it (spec): `/architect home page`
- [x] Build it: `/develop home page`
  - [x] Wire fresh portfolio data and exact loading and error behavior, **AC-1**, **AC-5**, **AC-6**
  - [x] Build anchored hero, project, skill, service, and contact sections, **AC-2**, **AC-3**, **AC-4**, **AC-5**
  - [x] Apply responsive Cyber Noir styling, accessibility, media fallbacks, and motion controls, **AC-5**, **AC-7**
  - [x] Add metadata, canonical URL, Person JSON LD, and Open Graph fallback, **AC-8**
- [x] Verify it: `/check verify home page`
- [x] Test it: `/test home page`
      [Spec 0001](../specs/web/0001-home-page/index.md) · code in `apps/web/`

### 7. About and resume sections · in-progress

Tell the professional story on the home page through projects, experience, education, certifications, skills, and services, then offer the current resume as a download.
**Done when:** visitors can understand the career timeline, scan grouped skills and credentials, and download the current resume; missing optional content does not leave broken sections.

- [x] Design it (spec): `/architect about and resume sections`
      [Spec 0002](../specs/web/0002-about-resume-page/index.md) · code in `apps/web/`
- [x] Build it: `/develop about and resume sections`
  - [x] Update the public boundary for complete ordered records, safe URLs, and date validation, **AC-3**, **AC-6**, **AC-7**, **AC-12**
  - [x] Build the server rendered home sections, shared scroll aware navigation, metadata, sitemap, and existing failure states, **AC-8**, **AC-9**, **AC-11**, **AC-13**
  - [x] Build Cyber Noir timeline sections, resume action, responsive layout, and accessibility behavior, **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-10**
- [ ] Verify it: `/check verify about and resume page`
- [ ] Test it: `/test about and resume page`

### 7a. Public UI reset · in-progress

Remove the current public visual system while keeping the portfolio readable, functional, and ready for a new approved design.
**Done when:** `/` uses a plain semantic baseline, preserves public content and contact behavior, contains no previous theme effects or copy, and passes the public quality checks.

- [x] Design it (spec): `/architect reset public UI`
      [Spec 0003](../specs/web/0003-reset-public-ui.md) · code in `apps/web/`
- [x] Build it: `/develop reset public UI`
  - [x] Remove visual theme components and presentation rules, **AC-1**, **AC-2**
  - [x] Preserve public data, contact, navigation, and accessibility behavior, **AC-3**, **AC-4**, **AC-5**
  - [x] Replace theme tests with neutral baseline checks, **AC-6**
- [ ] Verify it: `/check verify reset public UI`
- [ ] Test it: `/test reset public UI`

### 8. Services page · needs a decision

Explain the full stack services the owner offers and guide a suitable visitor toward contact.
**Done when:** active services render with clear outcomes and calls to action, inactive services stay hidden, and the page works across supported screen sizes and input methods.

- [ ] Design it (spec): `/architect services page`

### 9. Project discovery · needs a decision

Help technical reviewers find the work most relevant to a role by browsing and filtering projects by skill or category.
**Done when:** visitors can browse published projects, combine useful filters, clear them, share the resulting address, and understand empty, loading, and error states without losing context.

- [ ] Design it (spec): `/architect project discovery`

### 10. Project case study · needs a decision

Turn each project into evidence of engineering judgment, implementation skill, and measurable outcome.
**Done when:** every published project has a shareable detail page with its role, problem, decisions, stack, results, media, and available live or source links; missing optional fields are handled cleanly.

- [ ] Design it (spec): `/architect project case study`

### 11. Contact journey · needs a decision

Let a qualified visitor send a message and give the owner a dependable notification without exposing contact data.
**Done when:** a visitor can submit necessary contact details, see validation and clear success or failure feedback, and trigger one stored message and one owner notification; abuse controls, consent text, and a privacy notice protect the path.

- [ ] Design it (spec): `/architect contact journey`
