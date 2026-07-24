# Owner journey

This journey is complete when the owner can securely update every item in the first release without changing code.

### 12. Owner access · in-progress

Protect the dashboard for one owner with password sign in, secure session expiry, and sign out.
**Done when:** only the owner can reach dashboard data and actions, failed access reveals no private information, and the password only access flow works reliably.

- [x] Design it (spec): [0003 Owner access](../specs/_root/0003-owner-access/index.md)
- [ ] Build it: `/develop owner access`
- [ ] Verify it: `/check verify owner access`
- [ ] Test it: `/test owner access`
- [ ] Review it: `/check review owner access`
- [ ] Document it: `/document changelog`

Build milestones from the approved spec:

- [ ] Add Better Auth, the singleton owner mapping, migration, protected bootstrap, and concurrency proof. Covers AC 1 and AC 6.
- [ ] Deliver secure sessions, sign in, sign out, origin checks, rate limiting, and the owner API guard. Covers AC 2, AC 3, AC 4, and AC 6.
- [ ] Deliver accessible sign in and dashboard screens, then prove browser behavior, failure states, logs, and public portfolio isolation. Covers AC 2, AC 3, AC 4, AC 5, and AC 6.

### 13. Dashboard overview · needs a decision

Give the owner one clear starting point for content health, recent contact, and the next useful management action.
**Done when:** the owner can see current content counts, incomplete or missing content, recent unread messages, and direct routes to each management area, with clear empty and error states.

- [ ] Design it (spec): `/architect dashboard overview`

### 14. Profile and career content · needs a decision

Manage the profile, skills, experience, education, and certifications that feed the home and about pages.
**Done when:** the owner can create, edit, order, activate, and remove supported career content; validation prevents invalid public states and every save is reflected publicly without a code change.

- [ ] Design it (spec): `/architect profile and career content`

### 15. Services content · needs a decision

Keep service offerings current as the owner's focus and availability change.
**Done when:** the owner can create, edit, order, activate, and remove services with clear validation and confirmation that a save changes the public page immediately.

- [ ] Design it (spec): `/architect services content`

### 16. Project and media content · needs a decision

Create and maintain project case studies, their discovery fields, links, ordering, and uploaded images from one management flow.
**Done when:** the owner can create, edit, feature, publish, order, and remove projects; upload, replace, describe, reorder, and delete images; and preview enough context to avoid broken public content before saving.

- [ ] Design it (spec): `/architect project and media content`

### 17. Resume management

Replace the public resume without a code change, while keeping only the intended current file available to visitors.
**Done when:** the owner can upload and replace the resume, sees its file details and public status, invalid files are rejected, and the public download always returns the current valid file.

- [ ] Build it: `/develop resume management`

### 18. Contact inbox

Review, organize, and delete contact messages inside the protected dashboard.
**Done when:** the owner can list and open messages, distinguish unread from read, archive or delete a message with confirmation, and recover cleanly from loading and action errors.

- [ ] Build it: `/develop contact inbox`
