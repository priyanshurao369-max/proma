use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use rdev::{listen, Event, EventType, Key};
use enigo::{Enigo, Keyboard, Key as EnigoKey, Settings, Direction};

// ── Config ──────────────────────────────────────────────────────────────────

struct Config {
    api_url:    String,
    sync_token: String,
}

fn load_config() -> Config {
    // Reads from ~/.config/proma/config.toml
    // Falls back to env vars for development
    let config_path = dirs::config_dir()
        .unwrap()
        .join("proma")
        .join("config.toml");

    if config_path.exists() {
        let raw = std::fs::read_to_string(&config_path).unwrap();
        let table: toml::Table = raw.parse().unwrap();
        Config {
            api_url:    table["api_url"].as_str().unwrap().to_string(),
            sync_token: table["sync_token"].as_str().unwrap().to_string(),
        }
    } else {
        // Dev fallback — set these in your shell
        Config {
            api_url:    std::env::var("PROMA_API_URL")
                            .unwrap_or("http://localhost:3000".into()),
            sync_token: std::env::var("PROMA_SYNC_TOKEN")
                            .unwrap_or_default(),
        }
    }
}

// ── Prompt sync ─────────────────────────────────────────────────────────────

type PromptMap = Arc<Mutex<HashMap<String, String>>>;

fn sync_prompts(map: &PromptMap, config: &Config) {
    let client = reqwest::blocking::Client::new();
    let res = client
        .get(format!("{}/api/sync/prompts", config.api_url))
        .bearer_auth(&config.sync_token)
        .timeout(Duration::from_secs(10))
        .send();

    match res {
        Ok(resp) if resp.status().is_success() => {
            if let Ok(json) = resp.json::<serde_json::Value>() {
                if let Some(prompts) = json["prompts"].as_array() {
                    let mut m = map.lock().unwrap();
                    m.clear();
                    for p in prompts {
                        let content = p["content"]
                            .as_str()
                            .unwrap_or("")
                            .to_string();
                        if let Some(keys) = p["keys"].as_array() {
                            for k in keys {
                                if let Some(key_str) = k.as_str() {
                                    m.insert(
                                        key_str.to_lowercase(),
                                        content.clone()
                                    );
                                }
                            }
                        }
                    }
                    println!("Synced {} shortcuts", m.len());
                }
            }
        }
        Ok(resp) => eprintln!("Sync failed: HTTP {}", resp.status()),
        Err(e)   => eprintln!("Sync error: {}", e),
    }
}

// ── Key → char ──────────────────────────────────────────────────────────────

fn key_to_char(key: &Key) -> Option<char> {
    match key {
        Key::KeyA => Some('a'), Key::KeyB => Some('b'),
        Key::KeyC => Some('c'), Key::KeyD => Some('d'),
        Key::KeyE => Some('e'), Key::KeyF => Some('f'),
        Key::KeyG => Some('g'), Key::KeyH => Some('h'),
        Key::KeyI => Some('i'), Key::KeyJ => Some('j'),
        Key::KeyK => Some('k'), Key::KeyL => Some('l'),
        Key::KeyM => Some('m'), Key::KeyN => Some('n'),
        Key::KeyO => Some('o'), Key::KeyP => Some('p'),
        Key::KeyQ => Some('q'), Key::KeyR => Some('r'),
        Key::KeyS => Some('s'), Key::KeyT => Some('t'),
        Key::KeyU => Some('u'), Key::KeyV => Some('v'),
        Key::KeyW => Some('w'), Key::KeyX => Some('x'),
        Key::KeyY => Some('y'), Key::KeyZ => Some('z'),
        Key::Num0 => Some('0'), Key::Num1 => Some('1'),
        Key::Num2 => Some('2'), Key::Num3 => Some('3'),
        Key::Num4 => Some('4'), Key::Num5 => Some('5'),
        Key::Num6 => Some('6'), Key::Num7 => Some('7'),
        Key::Num8 => Some('8'), Key::Num9 => Some('9'),
        Key::Minus => Some('-'), Key::Unknown(_) => None,
        _ => None,
    }
}

// ── Main ────────────────────────────────────────────────────────────────────

fn main() {
    let config  = load_config();
    let map: PromptMap = Arc::new(Mutex::new(HashMap::new()));

    // Initial sync
    sync_prompts(&map, &config);

    // Background re-sync every 5 minutes
    let map_bg     = map.clone();
    let api_url    = config.api_url.clone();
    let sync_token = config.sync_token.clone();
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(300));
            sync_prompts(&map_bg, &Config { api_url: api_url.clone(), sync_token: sync_token.clone() });
        }
    });

    // Shared mutable buffer — tracks what the user is currently typing
    let buffer: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));

    let map_listener    = map.clone();
    let buffer_listener = buffer.clone();

    println!("Proma daemon running...");

    listen(move |event: Event| {
        if let EventType::KeyPress(key) = event.event_type {

            let mut buf = buffer_listener.lock().unwrap();

            match key {
                // ── Trigger keys: Space and Tab ──────────────────────────
                Key::Space | Key::Tab => {
                    if buf.starts_with('/') {
                        let lookup = buf.to_lowercase();
                        let map_lock = map_listener.lock().unwrap();

                        if let Some(expansion) = map_lock.get(&lookup) {
                            let expansion = expansion.clone();
                            let token_len = buf.len();
                            drop(map_lock);
                            buf.clear();
                            drop(buf); // release lock before doing IO

                            // Small delay so the OS processes the trigger key
                            thread::sleep(Duration::from_millis(30));

                            let mut enigo = Enigo::new(&Settings::default())
                                .expect("Failed to init enigo");

                            // Delete the typed shortcut
                            // (+1 for the space/tab that triggered)
                            for _ in 0..=token_len {
                                enigo.key(EnigoKey::Backspace, Direction::Click)
                                     .unwrap();
                            }

                            // Small pause so backspaces are processed
                            thread::sleep(Duration::from_millis(20));

                            // Type the full expansion
                            enigo.text(&expansion).unwrap();
                            return;
                        }
                    }
                    // Not a shortcut — reset buffer
                    buf.clear();
                }

                // ── Reset triggers ───────────────────────────────────────
                Key::Return
                | Key::Escape
                | Key::UpArrow
                | Key::DownArrow
                | Key::LeftArrow
                | Key::RightArrow => {
                    buf.clear();
                }

                // ── Backspace ───────────────────────────────────────────
                Key::Backspace => {
                    buf.pop();
                }

                // ── Character keys ──────────────────────────────────────
                _ => {
                    if let Some(c) = key_to_char(&key) {
                        buf.push(c);
                        // Prevent runaway buffer
                        if buf.len() > 100 {
                            buf.clear();
                        }
                    }
                }
            }
        }
    }).expect("Failed to start listener");
}