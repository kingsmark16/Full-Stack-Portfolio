# Portfolio content model

## Summary

Use relational records for portfolio content and private contact messages. The model keeps public publishing separate from private contact data. It gives the future dashboard clear ownership and editing boundaries.

## Decision

Use PostgreSQL records owned by NestJS through Prisma. Every main entity uses a database generated UUID, `createdAt`, and `updatedAt`.

## Data model

| Entity             | Required fields                                                                              | Optional fields                                                     | Rules                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Profile            | `id`, `singletonKey`, `name`, `biography`, `contactEmail`, `published`                       | `avatarUrl`, `phoneNumber`, `resumeUrl`                             | database check requires `singletonKey` to equal `default`, then unique constraint allows at most one row |
| Skill              | `id`, `name`, `displayOrder`, `published`                                                    | `iconUrl`                                                           | `displayOrder` is nonnegative                                                                            |
| Experience         | `id`, `company`, `role`, `startMonth`, `current`, `description`, `displayOrder`, `published` | `location`, `endMonth`                                              | dates use `YYYY-MM`                                                                                      |
| Education          | `id`, `institution`, `degree`, `startYear`, `current`, `displayOrder`, `published`           | `location`, `endYear`                                               | dates use four digit years                                                                               |
| Certification      | `id`, `name`, `issuingOrganization`, `issueYear`, `displayOrder`, `published`                | `credentialUrl`                                                     | issue year uses four digits                                                                              |
| Service            | `id`, `name`, `description`, `displayOrder`, `published`                                     | `iconUrl`                                                           | `displayOrder` is nonnegative                                                                            |
| Project            | `id`, `title`, `slug`, `description`, `displayOrder`, `published`                            | `imageUrl`, `projectUrl`, `repositoryUrl`, `startMonth`, `endMonth` | `slug` is lowercase, URL safe, and unique                                                                |
| ProjectSkill       | `projectId`, `skillId`                                                                       | None                                                                | composite primary key prevents duplicates                                                                |
| ContactMessage     | `id`, `idempotencyKey`, `name`, `email`, `message`, `status`, `submittedAt`                  | `readAt`                                                            | private data, no public flag, idempotency key is unique                                                  |
| ContactEmailOutbox | `id`, `contactMessageId`, `deduplicationKey`, `status`, `attemptCount`, `availableAt`        | `leaseUntil`, `lastError`, `deliveredAt`, `failedAt`                | one event per ContactMessage, deduplication key is unique                                                |

## Relationships

| From               | To             | Relationship                              |
| ------------------ | -------------- | ----------------------------------------- |
| Project            | Skill          | many to many through ProjectSkill         |
| Profile            | portfolio      | exactly one singleton record              |
| ContactMessage     | owner          | private records visible only to the owner |
| ContactEmailOutbox | ContactMessage | one delivery event per message            |

## State transitions

1. Public content: unpublished, published, unpublished. Only unpublished content may be hard deleted.
2. Experience: current with no end month, or completed with an end month.
3. Education: current with no end year, or completed with an end year.
4. ContactMessage: new, read, archived. The owner deletes messages when no longer needed.
5. ContactEmailOutbox: queued, processing, delivered, failed. A worker leases queued records and retries a bounded number of times.

## Key invariants

1. Public queries include only `published` records.
2. Completed Experience records require `endMonth`. Current records reject `endMonth`.
3. Completed Education records require `endYear`. Current records reject `endYear`.
4. Project and Skill pairs are unique.
5. Ordered public records sort by `displayOrder`, then `createdAt`.
6. URLs are optional strings validated at the API boundary.
7. Core text has API enforced limits. Names and titles allow 120 characters, biographies allow 2,000 characters, and descriptions allow 5,000 characters.
8. Contact names allow 1 to 120 characters. Contact messages allow 1 to 5,000 characters. Contact emails are trimmed and validated before saving.
9. ContactEmailOutbox, ContactMessage, and the idempotency key save in one transaction.

## Build notes

Create Prisma enums for ContactMessage and ContactEmailOutbox status. The worker follows the existing PostgreSQL outbox rules from the service integrations decision: `FOR UPDATE SKIP LOCKED` claims, a lease expiry, exponential retry delay, five maximum attempts, and Pino plus Sentry reporting for final failure. Enforce unique and checkable rules in the database where Prisma and PostgreSQL support them. Keep all Prisma types inside the API boundary.
