---
description: Core project rules for Proma — always apply these for every task
alwaysApply: true
priority: 1
---

# Proma — Project Rules

## What this project is

Proma is a prompt collection and management platform. It has two parts:
1. A **Next.js 14 web app** — where users log in, add prompts, browse the store, manage their library
2. A **Tauri desktop daemon** (Rust) — runs in the system tray, watches keyboard input system-wide, and expands typed shortcut keys into full prompts in any app on the user's computer

The core user experience is: user saves a prompt with a key like `/fix`, then types `/fix` + space anywhere on their computer (in any app), and the full prompt is automatically typed in place.

## Tech Stack

- **Framework**: Next.js 14 with App Router (not Pages Router — never use pages/)
- **Language**: TypeScript everywhere — no plain JS files
- **Database**: PostgreSQL hosted on Neon, accessed via Prisma ORM
- **Auth**: NextAuth.js with Google, GitHub, and Email+Password (credentials) providers
- **Desktop agent**: Tauri v2 with Rust backend + React frontend
- **Styling**: Tailwind CSS (no CSS modules, no styled-components)
- **State**: React hooks + SWR for data fetching (no Redux, no Zustand)
- **Package manager**: npm

## Project structure

```
proma/                          ← Next.js web app root
  app/
    (auth)/login/               ← Login page
    (app)/library/              ← Library page (main user view)
    (app)/library/collections/[id]/
    (app)/store/                ← Public prompt store
    (app)/store/[id]/           ← Single prompt detail
    (app)/prompt/new/           ← Add prompt form
    (app)/prompt/[id]/edit/     ← Edit prompt form
    (app)/profile/              ← Own profile
    (app)/u/[id]/               ← Public user profile
    api/
      auth/[...nextauth]/       ← NextAuth handler
      prompts/                  ← GET list, POST create
      prompts/[id]/             ← PATCH update, DELETE
      store/                    ← GET public prompts
      store/[id]/import/        ← POST import to library
      sync/                     ← GET for desktop daemon sync
      collections/              ← CRUD collections
      favourites/               ← CRUD favourites
  components/                   ← Shared UI components
  lib/
    prisma.ts                   ← Prisma client singleton
    auth.ts                     ← NextAuth config
  prisma/
    schema.prisma               ← Database schema

src-tauri/                      ← Tauri desktop daemon
  src/
    main.rs                     ← Entry point, tray, event loop
    watcher.rs                  ← rdev keyboard hook + key matching
    injector.rs                 ← enigo text injection
    cache.rs                    ← SQLite local cache (rusqlite)
    sync.rs                     ← HTTP sync with /api/sync
  Cargo.toml
```

## Environment variables

These must always exist in .env — never hardcode them:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret for NextAuth
- `NEXTAUTH_URL` — app base URL (http://localhost:3000 in dev)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google OAuth

## Key behaviours

- All prompts are **public by default** (`isPrivate: false`)
- Each prompt has `keys` — an array of trigger shortcuts (e.g. `["/fix", "/correct"]`)
- The desktop daemon keeps a local SQLite cache of prompts for offline/zero-latency access
- The daemon syncs with `GET /api/sync` on launch and every 5 minutes
- `/api/sync` returns both a `prompts` array and a flat `keyMap` object (`{ "/fix": { id, title, content } }`)
