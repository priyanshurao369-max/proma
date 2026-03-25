---
description: Database schema and Prisma usage rules for Proma
alwaysApply: true
priority: 2
globs: prisma/*.prisma,lib/prisma.ts,app/api/**/*.ts
---

# Database Rules

## Prisma client — always use the singleton

Always import from `@/lib/prisma`, never instantiate `new PrismaClient()` directly:

```ts
import { prisma } from '@/lib/prisma'
```

The singleton file (`lib/prisma.ts`) prevents connection pool exhaustion in Next.js dev mode.

## Schema — complete data models

### User
```prisma
model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  image         String?
  password      String?    // hashed with bcryptjs, null for OAuth users
  bio           String?
  createdAt     DateTime   @default(now())
  prompts       Prompt[]
  favourites    Favourite[]
  collections   Collection[]
  votes         Vote[]
  accounts      Account[]
  sessions      Session[]
}
```

### Prompt
```prisma
model Prompt {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  title          String
  content        String   // the full prompt text
  keywords       String[] // searchable tags e.g. ["code", "debug"]
  keys           String[] // trigger shortcuts e.g. ["/fix", "/correct"]
  isPrivate      Boolean  @default(false)
  useCount       Int      @default(0)
  importedFromId String?  // set when cloned from Store
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  favourites     Favourite[]
  votes          Vote[]
  collections    CollectionPrompt[]
}
```

### Vote
```prisma
model Vote {
  id        String   @id @default(cuid())
  userId    String
  promptId  String
  user      User     @relation(fields: [userId], references: [id])
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  type      VoteType // UP or DOWN
  createdAt DateTime @default(now())
  @@unique([userId, promptId]) // one vote per user per prompt
}

enum VoteType {
  UP
  DOWN
}
```

### Collection + join table
```prisma
model Collection {
  id          String             @id @default(cuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id])
  name        String
  description String?
  createdAt   DateTime           @default(now())
  prompts     CollectionPrompt[]
}

model CollectionPrompt {
  collectionId String
  promptId     String
  collection   Collection @relation(fields: [collectionId], references: [id])
  prompt       Prompt     @relation(fields: [promptId], references: [id])
  addedAt      DateTime   @default(now())
  @@id([collectionId, promptId])
}
```

### Favourite
```prisma
model Favourite {
  id        String   @id @default(cuid())
  userId    String
  promptId  String
  user      User     @relation(fields: [userId], references: [id])
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, promptId])
}
```

### NextAuth required models (do not modify)
```prisma
model Account { ... } // standard NextAuth Account model
model Session { ... } // standard NextAuth Session model
model VerificationToken { ... } // standard NextAuth VerificationToken model
```

## Query patterns

**Always check ownership before mutating:**
```ts
const prompt = await prisma.prompt.findUnique({ where: { id } })
if (!prompt || prompt.userId !== user.id) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

**Duplicate key check before creating a prompt:**
```ts
const existing = await prisma.prompt.findFirst({
  where: { userId: user.id, keys: { hasSome: newKeys } }
})
if (existing) return NextResponse.json({ error: 'Key already in use' }, { status: 409 })
```

**Increment useCount atomically:**
```ts
await prisma.prompt.update({
  where: { id },
  data: { useCount: { increment: 1 } }
})
```

**Store query (public prompts only):**
```ts
await prisma.prompt.findMany({
  where: { isPrivate: false },
  include: {
    user: { select: { id: true, name: true, image: true } },
    votes: true,
    _count: { select: { favourites: true } }
  },
  orderBy: { createdAt: 'desc' }
})
```
