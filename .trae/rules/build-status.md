---
description: Build and verification steps for Proma
alwaysApply: true
priority: 4
---

# Build / Verification

Run from `web/`:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

If Prisma schema changes:

- `npm run prisma:generate`
