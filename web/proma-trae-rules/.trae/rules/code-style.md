---
description: Code style, naming conventions, and frontend patterns for Proma
alwaysApply: true
priority: 3
globs: app/**/*.tsx,app/**/*.ts,components/**/*.tsx
---

# Code Style Rules

## Naming conventions

- Components: PascalCase (e.g. PromptCard, LibraryPage)
- Functions, variables, hooks: camelCase (e.g. fetchPrompts, usePrompts)
- API route files: always route.ts (Next.js App Router convention)
- Database model fields: camelCase matching Prisma schema exactly
- Trigger keys: always stored and compared lowercase (e.g. /fix not /Fix)
- CSS classes: Tailwind utility classes only

## TypeScript rules

- Always type function parameters and return values
- Use `type` for object shapes, `interface` only when extending
- Never use `any` — use `unknown` and narrow, or define a proper type
- Define shared types in `types/index.ts`

Shared types (types/index.ts):

```ts
export type Prompt = {
  id: string
  userId: string
  title: string
  content: string
  keywords: string[]
  keys: string[]
  isPrivate: boolean
  useCount: number
  createdAt: string
  updatedAt: string
}

export type PromptWithUser = Prompt & {
  user: { id: string; name: string | null; image: string | null }
}

export type Collection = {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: string
}
```

## React component rules

- Always use functional components with hooks
- Add 'use client' only on components needing browser APIs or event handlers
- Keep page components lean — extract logic into custom hooks in hooks/
- Use useSession() from next-auth/react for client-side auth
- Use getServerSession(authOptions) in server components and API routes

Protected page pattern:

```tsx
'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  if (status === 'loading') return <div className="p-8 text-center">Loading...</div>
  if (!session) return null

  return <div>content here</div>
}
```

## Data fetching with SWR

```ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function usePrompts() {
  const { data, error, mutate } = useSWR('/api/prompts', fetcher)
  return {
    prompts: (data as Prompt[]) ?? [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  }
}
```

## Tailwind design tokens for Proma

- Brand purple: bg-[#5B4FCF] / text-[#5B4FCF] / border-[#5B4FCF]
- Light purple surface: bg-[#EAE8FB]
- Trigger key pill: bg-[#EAE8FB] text-[#5B4FCF] text-sm font-semibold px-3 py-0.5 rounded-full
- Card: bg-white border border-gray-100 rounded-xl p-5 shadow-sm
- Input: w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4FCF]
- Primary button: px-4 py-2 bg-[#5B4FCF] text-white rounded-lg text-sm font-medium hover:bg-[#4a3fb5] transition-colors

## API call pattern from client

```ts
async function savePrompt(data: Partial<Prompt>) {
  const res = await fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Something went wrong')
  }
  return res.json() as Promise<Prompt>
}
```

Always handle errors — never silently swallow failed fetch calls.

## File length

Keep files under 200 lines. If a file exceeds this, split it:
- Extract form logic → hooks/usePromptForm.ts
- Extract card UI → components/PromptCard.tsx
- Extract API logic → lib/api/prompts.ts
