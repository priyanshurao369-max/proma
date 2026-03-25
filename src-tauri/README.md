# Proma Desktop Daemon

This background process expands shortcut keys like `/sry` into full prompt text in any app (system-wide).

## Prerequisites

- Install Rust: https://www.rust-lang.org/tools/install

## Configure

1. Start the web app (`web/`) so the sync API is available.
2. Log into the web app in your browser.
3. Create a sync token by calling:
   - `POST http://localhost:3000/api/sync/token`
4. Save the returned token string to:
   - Windows: `%USERPROFILE%\.proma\token.txt`

Optional environment variables:

- `PROMA_SYNC_URL` (default: `http://localhost:3000/api/sync/prompts`)
- `PROMA_SYNC_INTERVAL_SECS` (default: `300`)

## Run

From the repo root:

```bash
cd src-tauri
cargo run
```

Keep it running in the background.
