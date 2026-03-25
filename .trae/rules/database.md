---
description: Prisma + database conventions for Proma
alwaysApply: true
priority: 3
---

# Database Rules

## Prisma client

- Always import the Prisma singleton from `web/src/lib/prisma.ts`:
  - `import { prisma } from "@/lib/prisma";`

## Schema & migrations

- Schema is `web/prisma/schema.prisma`.
- Migrations are in `web/prisma/migrations/`.
- After changing schema: run `npm run prisma:generate` (from `web/`).

## Ownership checks

- Before mutating prompts/collections/favourites, verify `userId` matches the session user.
