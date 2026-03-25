---
description: API route patterns and auth rules for Proma Next.js backend
alwaysApply: false
globs: app/api/**/*.ts
priority: 2
---

# API Rules

## Auth pattern — use this in every protected route

```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ... rest of handler
}
```

## All API routes

### Prompts
- `GET  /api/prompts` — list own prompts, query: `?sort=recent|mostUsed&search=`
- `POST /api/prompts` — create. Body: `{ title, content, keywords, keys, isPrivate }`
- `GET  /api/prompts/[id]` — get single (own or public)
- `PATCH /api/prompts/[id]` — update (owner only)
- `DELETE /api/prompts/[id]` — delete (owner only)
- `POST /api/prompts/[id]/use` — increment useCount

### Store
- `GET  /api/store` — public prompts. Query: `?sort=votes|recent|uses&search=&page=`
- `POST /api/store/[id]/import` — clone into own library

### Votes
- `POST   /api/prompts/[id]/vote` — body: `{ type: 'UP' | 'DOWN' }`. Upserts (voting same type again removes vote)
- `DELETE /api/prompts/[id]/vote` — remove vote

### Collections
- `GET    /api/collections` — list own
- `POST   /api/collections` — create. Body: `{ name, description? }`
- `PATCH  /api/collections/[id]` — rename
- `DELETE /api/collections/[id]` — delete (prompts remain)
- `POST   /api/collections/[id]/prompts` — add prompt. Body: `{ promptId }`
- `DELETE /api/collections/[id]/prompts/[promptId]` — remove

### Favourites
- `GET    /api/favourites` — list own
- `POST   /api/favourites` — body: `{ promptId }`
- `DELETE /api/favourites/[promptId]` — remove

### Desktop sync
- `GET /api/sync` — returns `{ prompts: [...], keyMap: { "/fix": { id, title, content } } }`
  - Uses session cookie auth (not Bearer token for now)
  - Only returns prompts belonging to the authenticated user
  - The `keyMap` is a flat key → prompt object map for O(1) lookup in the daemon

### User profiles  
- `GET  /api/users/[id]` — public profile + public prompts
- `PATCH /api/users/me` — update own bio, name

## Response conventions

Always return JSON. Success = 200/201, validation error = 400, auth error = 401, not found / wrong owner = 404, conflict (duplicate key) = 409, server error = 500.

Never return `null` — always return an object or array.

## Body validation

Validate required fields at the top of POST/PATCH handlers before touching the DB:

```ts
const { title, content } = await req.json()
if (!title?.trim() || !content?.trim()) {
  return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
}
```
