---
description: API route conventions for Proma (Next.js App Router)
alwaysApply: true
priority: 3
---

# API Rules

## Location

- Route handlers live in `web/src/app/api/**/route.ts`.

## Auth

- Use `getSessionUserId()` and return `401` when missing.

## Demo mode

- If `demoNoDb` is enabled, route handlers should use the demo helpers in `web/src/lib/demo.ts` instead of Prisma.

## Validation

- Validate request bodies and query params with `zod`.
- Prefer returning `{ error: string }` on failure.

## Response

- Always return JSON via `NextResponse.json(...)`.
