---
description: Tauri desktop daemon architecture and Rust rules for Proma
alwaysApply: false
globs: src-tauri/**/*.rs,src-tauri/Cargo.toml
priority: 2
---

# Desktop Daemon Rules (Tauri + Rust)

## What the daemon does

The Proma desktop daemon is a Tauri v2 app that:
1. Runs silently in the system tray on Windows, macOS, and Linux
2. Listens to ALL keystrokes system-wide using `rdev`
3. Maintains a rolling buffer of typed characters
4. When the buffer matches a registered key (e.g. `/fix`) followed by space or enter:
   - Erases the typed key with backspace keypresses
   - Types the full prompt content into the focused field using `enigo`
5. Keeps a local SQLite cache (via `rusqlite`) so it works offline
6. Syncs with `GET http://localhost:3000/api/sync` on launch and every 5 minutes

## Rust crates (Cargo.toml dependencies)

```toml
[dependencies]
tauri = { version = "2", features = [] }
rdev = "0.5"              # global keyboard listener
enigo = "0.1"             # keyboard simulation / text injection
rusqlite = { version = "0.31", features = ["bundled"] }  # local SQLite cache
reqwest = { version = "0.12", features = ["json", "blocking"] }  # HTTP sync
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

## File responsibilities

- `main.rs` — Tauri app entry point, system tray setup, spawns the watcher thread
- `watcher.rs` — rdev `listen()` loop, rolling buffer, key matching logic
- `injector.rs` — enigo backspace + type_string functions
- `cache.rs` — SQLite: `ensure_db()`, `load_key_map()`, `save_prompts()`
- `sync.rs` — reqwest: calls /api/sync, writes results to SQLite

## Local SQLite schema

```sql
CREATE TABLE IF NOT EXISTS prompts (
  id      TEXT PRIMARY KEY,
  title   TEXT NOT NULL,
  content TEXT NOT NULL,
  keys    TEXT NOT NULL   -- JSON array e.g. '["/fix","/correct"]'
);

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL     -- stores trigger_prefix, sync_interval, etc.
);
```

DB file location: `~/.proma/cache.db` (create directory if it doesn't exist)

## Key matching logic

```rust
// In the rdev KeyPress handler:
// 1. Add char to buffer (max 64 chars, clear on overflow)
// 2. On Space or Return: check if buffer.trim() matches any key in key_map
// 3. On match: spawn thread to erase + inject
// 4. Always clear buffer on Space/Return regardless of match
// 5. On Backspace: pop last char from buffer

let buf = state.buffer.trim().to_lowercase();
if let Some(prompt) = state.key_map.get(&buf) {
    let key_len = buf.len() + 1; // +1 for the space/enter
    thread::spawn(move || {
        erase_chars(key_len);
        thread::sleep(Duration::from_millis(200)); // wait for focus to return
        type_string(&prompt.content);
    });
}
state.buffer.clear();
```

## Text injection

```rust
// injector.rs
use enigo::{Enigo, KeyboardControllable};

pub fn erase_chars(count: usize) {
    let mut enigo = Enigo::new();
    for _ in 0..count {
        enigo.key_click(enigo::Key::Backspace);
    }
}

pub fn type_string(text: &str) {
    let mut enigo = Enigo::new();
    enigo.key_sequence(text);
}
```

## Sync flow

```rust
// sync.rs — blocking HTTP, run in a thread not on main
pub fn sync_from_api(db_path: &str) {
    // Read session cookie or token from ~/.proma/token.txt
    // GET http://localhost:3000/api/sync
    // Parse response: { prompts: [...], keyMap: {...} }
    // Write prompts to SQLite
    // Reload key_map in shared AppState
}
```

## Platform notes

- macOS: requires `com.apple.security.automation.apple-events` entitlement for global keyboard access. Add to `src-tauri/entitlements.plist`
- Linux: requires `ydotool` or `xdotool` to be installed for `enigo` text injection in Wayland environments
- Windows: no special permissions needed, WinAPI hooks work out of the box

## What NOT to do

- Never log keystrokes to disk — the buffer is in-memory only and cleared on every space/enter
- Never block the main thread with the rdev listener — always run in a separate thread
- Never call enigo from the rdev callback thread — always spawn a new thread for injection (avoids deadlock)
