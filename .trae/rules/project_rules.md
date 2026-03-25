---
description: Core project rules for Proma — apply for every task
alwaysApply: true
priority: 1
---

# Proma — Project Rules

## Repository layout

- This repo is a Next.js app located in `web/`.
- App Router pages live in `web/src/app/`.
- Shared components live in `web/src/components/`.
- Server utilities live in `web/src/lib/`.
- Prisma schema + migrations live in `web/prisma/`.

## Tech stack (current)

- Next.js (App Router) + TypeScript
- Tailwind CSS
- NextAuth (session/cookie auth)
- Prisma (PostgreSQL in DB mode)
- Demo mode supported via `DEMO_MODE_NO_DB=true`

## Commands (run from `web/`)

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run dev -- -p 3000`
- After Prisma schema changes: `npm run prisma:generate`

## Environment variables

- Demo mode: `DEMO_MODE_NO_DB=true`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- DB mode: `DATABASE_URL`

## Key behaviors

- Prompts have `keys` (shortcuts like `/fix`) that can expand in the editor.
- In demo mode, data is in-memory and must be resilient to dev reloads.
