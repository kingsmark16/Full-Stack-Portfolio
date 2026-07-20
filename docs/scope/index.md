# Scope: Full stack portfolio

A production portfolio for hiring managers and technical interviewers. It presents the owner's work and services, while a private dashboard keeps portfolio content current without code changes.

**Build approach:** Journey (finish one complete visitor or owner path before starting the next).
**Workflow:** Full (`/check verify`, `/test`, `/check review`, then `/document` after `/develop`). This is the project default. `/architect` still gates every feature that needs a decision.

## At a glance

| #   | Feature                         | Phase           | Status      |
| --- | ------------------------------- | --------------- | ----------- |
| 1   | Stack and architecture          | Foundation      | done        |
| 2   | Coding standards and tooling    | Foundation      | done        |
| 3   | Portfolio data model            | Foundation      | done        |
| 4   | Design system and UI foundation | Foundation      | done        |
| 5   | Connected portfolio skeleton    | Skeleton        | done        |
| 6   | Home page                       | Visitor journey | in-progress |
| 7   | About and resume page           | Visitor journey | planned     |
| 8   | Services page                   | Visitor journey | planned     |
| 9   | Project discovery               | Visitor journey | planned     |
| 10  | Project case study              | Visitor journey | planned     |
| 11  | Contact journey                 | Visitor journey | planned     |
| 12  | Owner access                    | Owner journey   | planned     |
| 13  | Dashboard overview              | Owner journey   | planned     |
| 14  | Profile and career content      | Owner journey   | planned     |
| 15  | Services content                | Owner journey   | planned     |
| 16  | Project and media content       | Owner journey   | planned     |
| 17  | Resume management               | Owner journey   | planned     |
| 18  | Contact inbox                   | Owner journey   | planned     |
| 19  | Search and social visibility    | Launch journey  | planned     |
| 20  | Analytics and error monitoring  | Launch journey  | planned     |
| 21  | Production release              | Launch journey  | planned     |

## Epic status

[Foundations](foundations.md): 5 features are done, 0 are in progress, and 0 are planned. Together they establish the monorepo, shared decisions, and a working connection across the site, API, and stored data.

[Visitor journey](visitor.md): 1 feature is in progress and 5 are planned. Together they let a hiring manager understand the owner, inspect relevant work, download a resume, and make contact.

[Owner journey](owner.md): 7 planned features let the owner sign in and manage all public content, media, the resume, and contact messages.

[Launch journey](launch.md): 3 planned features make the portfolio discoverable, measurable, monitored, and ready for production use.

## Deferred

These are outside the first release and remain visible so the plan stays honest.

- **Articles:** publish technical writing from the dashboard, needs a decision
- **Multiple administrators:** invite other content managers and assign roles, needs a decision
- **Multiple languages:** publish localized public content, needs a decision
- **Revision history:** restore earlier versions of saved content, needs a decision
- **Public accounts:** let visitors create accounts, needs a decision
- **Booking:** let visitors schedule a meeting, needs a decision
- **Testimonials:** manage and publish client or colleague testimonials, needs a decision
- **Billing:** sell services or digital products, needs a decision

## Legend

**The decision box:** a feature marked `needs a decision` begins with `/architect`. A feature without that tag begins with `/develop`, except coding standards and tooling, which begins with `/audit`.

| State         | Set by                                         | Meaning                                                                       |
| ------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `planned`     | `/scope`                                       | The feature is ordered and ready for its first command.                       |
| `in-progress` | `/architect` or `/develop`                     | Design or build work has started.                                             |
| `done`        | The last required workflow stage, then `/sync` | Build, verification, tests, and all required Full workflow work are complete. |
| `existing`    | `/scope`                                       | The feature existed before this workflow.                                     |
| `dropped`     | `/scope`                                       | The feature is no longer planned, but remains for history.                    |

- The next step is the first unticked box.
- Atomic build tasks belong in the feature spec, not in this scope.
- A feature spec adds its build milestones, verification, and test boxes here.
- Full workflow means `/check verify`, `/test`, `/check review`, and `/document` normally follow `/develop`.
- An assumed decision cannot reach `done` until `/architect` confirms it.
