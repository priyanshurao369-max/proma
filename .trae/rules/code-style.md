---
description: Code style and conventions for Proma
alwaysApply: true
priority: 2
---

# Code Style

## General

- Use TypeScript everywhere.
- Prefer small, readable functions and components.
- Do not add comments unless explicitly requested.

## React / Next.js

- Use Server Components by default; add `"use client"` only when needed.
- Use `next/navigation` (`redirect`, `notFound`, `useRouter`) for App Router navigation.
- Keep server-only logic in `web/src/app/**` route handlers and server pages.

## Styling

- Tailwind utility classes only.

## Data fetching / APIs

- Validate inputs with `zod` in route handlers.
- Use `getSessionUserId()` for auth in API routes.
- Support `demoNoDb` branches where applicable.
