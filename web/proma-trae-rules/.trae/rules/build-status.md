---
description: Current build status — what exists and what still needs building
alwaysApply: true
priority: 1
---

# Proma — Current Build Status

Use this file to understand what has already been built vs what still needs to be done.
Update this file as features are completed.

## What exists

- [x] Next.js 14 project scaffolded

## What needs to be built (in priority order)

### Phase 1 — Foundation (do this first)
- [ ] lib/prisma.ts — Prisma singleton
- [ ] lib/auth.ts — NextAuth config (Google + GitHub + Email/Password)
- [ ] prisma/schema.prisma — full schema (User, Prompt, Vote, Collection, CollectionPrompt, Favourite + NextAuth models)
- [ ] .env — DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [ ] app/api/auth/[...nextauth]/route.ts — NextAuth handler
- [ ] app/api/prompts/route.ts — GET list + POST create
- [ ] app/api/prompts/[id]/route.ts — PATCH + DELETE
- [ ] app/api/sync/route.ts — GET for desktop daemon (returns prompts + keyMap)
- [ ] app/(auth)/login/page.tsx — login form
- [ ] app/providers.tsx — SessionProvider wrapper
- [ ] app/layout.tsx — wrap with Providers

### Phase 2 — Library
- [ ] app/(app)/library/page.tsx — All / Favourites / Collections tabs
- [ ] app/(app)/prompt/new/page.tsx — add prompt form
- [ ] app/(app)/prompt/[id]/edit/page.tsx — edit prompt form
- [ ] app/api/favourites/route.ts
- [ ] app/api/collections/route.ts + app/api/collections/[id]/route.ts
- [ ] components/PromptCard.tsx
- [ ] hooks/usePrompts.ts

### Phase 3 — Store
- [ ] app/(app)/store/page.tsx — public prompt feed
- [ ] app/(app)/store/[id]/page.tsx — prompt detail
- [ ] app/api/store/route.ts — public GET
- [ ] app/api/store/[id]/import/route.ts — POST clone
- [ ] app/api/prompts/[id]/vote/route.ts
- [ ] app/(app)/u/[id]/page.tsx — public user profile
- [ ] app/(app)/profile/page.tsx — own profile

### Phase 4 — Desktop Daemon (Tauri)
- [ ] src-tauri/ — Tauri project init
- [ ] src-tauri/src/main.rs — entry + tray
- [ ] src-tauri/src/watcher.rs — rdev keyboard hook
- [ ] src-tauri/src/injector.rs — enigo text injection
- [ ] src-tauri/src/cache.rs — SQLite read/write
- [ ] src-tauri/src/sync.rs — HTTP sync

## Current blocker

The keyword trigger (/fix → prompt expansion) requires ALL of Phase 1 AND Phase 4 to be complete.
Phase 4 (daemon) is useless without Phase 1 (the API it syncs from).
Build Phase 1 first, verify prompts are saved and /api/sync returns correct data, then build Phase 4.
