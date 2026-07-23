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

### 7. About and resume sections · existing

Tell the professional story on the home page through projects, experience, education, certifications, skills, and services, then offer the current resume as a download.
This capability already exists in the public home page. It is skipped by the current workflow. [Spec 0002](../specs/web/0002-about-resume-page/index.md) · code in `apps/web/`

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

### 8. Services page · existing

Explain the full stack services the owner offers and guide a suitable visitor toward contact.
This capability already exists as a services section on the public home page. It is skipped by the current workflow. Code in `apps/web/`

### 9. Project discovery · existing

Help technical reviewers find the work most relevant to a role by browsing and filtering projects by skill or category.
This capability already exists through the public project archive. It is skipped by the current workflow. Code in `apps/web/`

### 10. Project case study · existing

Turn each project into evidence of engineering judgment, implementation skill, and measurable outcome.
This capability already exists through the project detail content shown in the public archive. It is skipped by the current workflow. Code in `apps/web/`

### 11. Contact journey · in-progress

Let a qualified visitor send a message and give the owner a dependable notification without exposing contact data.
**Done when:** a visitor can submit necessary contact details, see validation and clear success or failure feedback, and trigger one stored message and one owner notification; abuse controls, consent text, and a privacy notice protect the path.

- [x] Design it (spec): `/architect contact journey`
      [Spec 0002](../specs/0002-portfolio-content/0002-contact-form.md) · code in `apps/api/src/contact/`
- [ ] Build it: `/develop contact journey`
  - [ ] Add the email gateway port, fake gateway, Resend configuration, and safe message formatter, **AC-1**, **AC-2**, **AC-5**, **AC-6**
  - [ ] Add the lease-token migration and outbox worker claim, retry, lease-recovery, and failure lifecycle, **AC-2**, **AC-3**, **AC-4**, **AC-5**
  - [ ] Add the standalone worker command, deployment configuration, and automated delivery tests, **AC-1** through **AC-6**
- [ ] Verify it: `/check verify contact journey`
- [ ] Test it: `/test contact journey`
