# Portfolio content rationale

## Context

The portfolio needs a public page now and a dashboard later. A static page would require code changes for every content update. The data model must therefore support the owner, visitor reads, future dashboard editing, and private contact messages without letting Next.js access PostgreSQL directly.

> Premise note: This topic spans the content model, public read path, and contact delivery flow. They are recorded as separate child decisions under one umbrella because they share the same data boundary, but each can be built and tested independently.

## Options considered

### One nested portfolio document

One JSON document is quick to display. It becomes difficult to edit, validate, order, and relate to projects as the dashboard grows.

### Separate public endpoint for each section

Separate endpoints give each section an isolated API. The home page would need several requests and could render a mixed snapshot when content changes between requests.

### Relational model with one combined public read

Structured records keep dashboard editing and relationships clear. One combined read gives the public page a consistent snapshot, while the internal repository layer can still query each entity separately.

## Rationale

The portfolio has clear relationships, notably the many to many relationship between Projects and Skills. PostgreSQL and Prisma fit that shape directly. A combined public response reduces first page latency and keeps page rendering simple. Contact messages need durable storage before notification so a temporary email failure does not lose a visitor inquiry.
