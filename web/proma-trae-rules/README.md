# Proma — Trae Rules

Drop the entire `.trae/` folder into the root of your Proma Next.js project.

## Rule files and what they do

| File | Always active | Purpose |
|---|---|---|
| `project_rules.md` | Yes | Full project overview — stack, structure, env vars, core behaviour |
| `database.md` | When editing Prisma/API files | Complete schema + Prisma query patterns |
| `api.md` | When editing app/api/ | All routes, auth pattern, response conventions |
| `desktop-daemon.md` | When editing src-tauri/ | Rust crate setup, watcher logic, injection, sync |
| `code-style.md` | Yes | TypeScript, naming, Tailwind tokens, component patterns |
| `build-status.md` | Yes | Checklist of what's built vs what still needs building |

## How to use in Trae

1. Copy the `.trae/` folder into your project root
2. Open Trae → click the Settings icon in the AI chat panel → Rules
3. Your project rules will appear automatically
4. Use `#rulename` in chat to explicitly invoke a specific rule (e.g. `#database`, `#api`)

## Updating build-status.md

After you finish each feature, open `build-status.md` and check the box:
```
- [ ] feature not done yet
- [x] feature completed
```

This keeps Trae aware of what exists so it doesn't try to recreate things or miss dependencies.
