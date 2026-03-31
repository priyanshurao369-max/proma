use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use rdev::{listen, Event, EventType, Key};
use enigo::{Enigo, Keyboard, Key as EnigoKey, Settings, Direction};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_sql::{Migration, MigrationKind, TauriSql};
use serde::{Deserialize, Serialize};

// ── Models ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub content: String,
    pub keys: String, // JSON array string
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
}

// ── Shared State ─────────────────────────────────────────────────────────────

pub type PromptCache = Arc<Mutex<HashMap<String, String>>>;

// ── Key → char (Helper) ─────────────────────────────────────────────────────

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
        Key::Minus => Some('-'), Key::Slash => Some('/'),
        _ => None,
    }
}

// ── Background Daemon ────────────────────────────────────────────────────────

fn start_daemon(cache: PromptCache) {
    thread::spawn(move || {
        let buffer: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
        
        println!("Proma keyboard listener starting...");

        if let Err(error) = listen(move |event: Event| {
            if let EventType::KeyPress(key) = event.event_type {
                let mut buf = buffer.lock().unwrap();

                match key {
                    Key::Space | Key::Tab => {
                        if buf.starts_with('/') {
                            let lookup = buf.to_lowercase();
                            let map = cache.lock().unwrap();

                            if let Some(expansion) = map.get(&lookup) {
                                let expansion = expansion.clone();
                                let token_len = buf.len();
                                drop(map);
                                buf.clear();
                                drop(buf);

                                thread::sleep(Duration::from_millis(30));

                                let mut enigo = Enigo::new(&Settings::default())
                                    .expect("Failed to init enigo");

                                for _ in 0..=token_len {
                                    let _ = enigo.key(EnigoKey::Backspace, Direction::Click);
                                }

                                thread::sleep(Duration::from_millis(20));
                                let _ = enigo.text(&expansion);
                                return;
                            }
                        }
                        buf.clear();
                    }
                    Key::Return | Key::Escape | Key::UpArrow | Key::DownArrow | Key::LeftArrow | Key::RightArrow => {
                        buf.clear();
                    }
                    Key::Backspace => {
                        buf.pop();
                    }
                    _ => {
                        if let Some(c) = key_to_char(&key) {
                            buf.push(c);
                            if buf.len() > 100 { buf.clear(); }
                        }
                    }
                }
            }
        }) {
            eprintln!("Error: {:?}", error);
        }
    });
}

#[tauri::command]
async fn is_daemon_alive() -> bool {
    true
}

#[tauri::command]
async fn refresh_prompts(app: AppHandle, cache: tauri::State<'_, PromptCache>) -> Result<(), String> {
    let db = app.sql_plugin();
    let results = db.select::<Prompt>("SELECT id, title, content, keys FROM prompts", []).await
        .map_err(|e| e.to_string())?;

    let mut map = cache.lock().unwrap();
    map.clear();

    for p in results {
        if let Ok(keys_vec) = serde_json::from_str::<Vec<String>>(&p.keys) {
            for k in keys_vec {
                let key = if k.starts_with('/') { k.to_lowercase() } else { format!("/{}", k).to_lowercase() };
                map.insert(key, p.content.clone());
            }
        }
    }
    
    println!("Synced {} shortcuts to memory", map.len());
    Ok(())
}

#[tauri::command]
async fn get_prompts(app: AppHandle) -> Result<Vec<Prompt>, String> {
    let db = app.sql_plugin();
    db.select::<Prompt>("SELECT id, title, content, keys FROM prompts ORDER BY created_at DESC", [])
        .await.map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CollectionDetail {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub prompts: Vec<Prompt>,
}

#[tauri::command]
async fn get_collection_detail(app: AppHandle, id: String) -> Result<CollectionDetail, String> {
    let db = app.sql_plugin();
    let collection = db.select::<Collection>("SELECT id, name, description, icon FROM collections WHERE id = ?", [id.clone()])
        .await.map_err(|e| e.to_string())?
        .into_iter().next()
        .ok_or_else(|| "Collection not found".to_string())?;

    let prompts = db.select::<Prompt>(
        "SELECT p.id, p.title, p.content, p.keys FROM prompts p 
         JOIN prompt_collections pc ON p.id = pc.prompt_id 
         WHERE pc.collection_id = ? 
         ORDER BY p.created_at DESC",
        [id]
    ).await.map_err(|e| e.to_string())?;

    Ok(CollectionDetail {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        icon: collection.icon,
        prompts,
    })
}

#[tauri::command]
async fn create_prompt(
    app: AppHandle,
    cache: tauri::State<'_, PromptCache>,
    id: String,
    title: String,
    content: String,
    keys: Vec<String>
) -> Result<(), String> {
    let db = app.sql_plugin();
    let keys_json = serde_json::to_string(&keys).unwrap_or_else(|_| "[]".to_string());
    
    db.execute(
        "INSERT INTO prompts (id, title, content, keys) VALUES (?, ?, ?, ?)",
        [id, title, content, keys_json]
    ).await.map_err(|e| e.to_string())?;

    refresh_prompts(app, cache).await
}

#[tauri::command]
async fn update_prompt(
    app: AppHandle,
    cache: tauri::State<'_, PromptCache>,
    id: String,
    title: String,
    content: String,
    keys: Vec<String>
) -> Result<(), String> {
    let db = app.sql_plugin();
    let keys_json = serde_json::to_string(&keys).unwrap_or_else(|_| "[]".to_string());
    
    db.execute(
        "UPDATE prompts SET title = ?, content = ?, keys = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title, content, keys_json, id]
    ).await.map_err(|e| e.to_string())?;

    refresh_prompts(app, cache).await
}

#[tauri::command]
async fn delete_prompt(
    app: AppHandle,
    cache: tauri::State<'_, PromptCache>,
    id: String
) -> Result<(), String> {
    let db = app.sql_plugin();
    db.execute("DELETE FROM prompts WHERE id = ?", [id])
        .await.map_err(|e| e.to_string())?;

    refresh_prompts(app, cache).await
}

// ── Collection Commands ─────────────────────────────────────────────────────

#[tauri::command]
async fn get_collections(app: AppHandle) -> Result<Vec<Collection>, String> {
    let db = app.sql_plugin();
    db.select::<Collection>("SELECT id, name, description, icon FROM collections ORDER BY name ASC", [])
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_collection(
    app: AppHandle,
    id: String,
    name: String,
    description: Option<String>,
    icon: Option<String>
) -> Result<(), String> {
    let db = app.sql_plugin();
    db.execute(
        "INSERT INTO collections (id, name, description, icon) VALUES (?, ?, ?, ?)",
        [id, name, description, icon]
    ).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_collection(app: AppHandle, id: String) -> Result<(), String> {
    let db = app.sql_plugin();
    db.execute("DELETE FROM collections WHERE id = ?", [id])
        .await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_prompt_collections(app: AppHandle, prompt_id: String) -> Result<Vec<Collection>, String> {
    let db = app.sql_plugin();
    db.select::<Collection>(
        "SELECT c.id, c.name, c.description, c.icon FROM collections c 
         JOIN prompt_collections pc ON c.id = pc.collection_id 
         WHERE pc.prompt_id = ?",
        [prompt_id]
    ).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_prompt_to_collection(app: AppHandle, prompt_id: String, collection_id: String) -> Result<(), String> {
    let db = app.sql_plugin();
    db.execute(
        "INSERT OR IGNORE INTO prompt_collections (prompt_id, collection_id) VALUES (?, ?)",
        [prompt_id, collection_id]
    ).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn remove_prompt_from_collection(app: AppHandle, prompt_id: String, collection_id: String) -> Result<(), String> {
    let db = app.sql_plugin();
    db.execute(
        "DELETE FROM prompt_collections WHERE prompt_id = ? AND collection_id = ?",
        [prompt_id, collection_id]
    ).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ── Favourite Commands ──────────────────────────────────────────────────────

#[tauri::command]
async fn toggle_favourite(app: AppHandle, prompt_id: String) -> Result<bool, String> {
    let db = app.sql_plugin();
    let is_fav = db.select::<serde_json::Value>("SELECT 1 FROM favourites WHERE prompt_id = ?", [prompt_id.clone()])
        .await.map(|r| !r.is_empty())
        .map_err(|e| e.to_string())?;

    if is_fav {
        db.execute("DELETE FROM favourites WHERE prompt_id = ?", [prompt_id])
            .await.map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        db.execute("INSERT INTO favourites (prompt_id) VALUES (?)", [prompt_id])
            .await.map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
async fn get_favourites(app: AppHandle) -> Result<Vec<Prompt>, String> {
    let db = app.sql_plugin();
    db.select::<Prompt>(
        "SELECT p.id, p.title, p.content, p.keys FROM prompts p 
         JOIN favourites f ON p.id = f.prompt_id 
         ORDER BY f.created_at DESC",
        []
    ).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn is_favourite(app: AppHandle, prompt_id: String) -> Result<bool, String> {
    let db = app.sql_plugin();
    let results = db.select::<serde_json::Value>("SELECT 1 FROM favourites WHERE prompt_id = ?", [prompt_id])
        .await.map_err(|e| e.to_string())?;
    Ok(!results.is_empty())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cache: PromptCache = Arc::new(Mutex::new(HashMap::new()));
    
    // Add migrations
    let migrations = vec![
        Migration {
            version: 1,
            description: "create prompts table",
            sql: include_str!("../migrations/01_create_prompts_table.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create collections and favourites table",
            sql: include_str!("../migrations/02_collections_and_favourites.sql"),
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:proma.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(cache.clone())
        .setup(|app| {
            let handle = app.handle().clone();
            let cache_clone = cache.clone();
            
            // Initial sync from DB to Cache
            tauri::async_runtime::spawn(async move {
                let _ = refresh_prompts(handle, tauri::State::from(&cache_clone)).await;
            });

            // Start the daemon
            start_daemon(cache);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            refresh_prompts,
            get_prompts,
            create_prompt,
            update_prompt,
            delete_prompt,
            get_collections,
            create_collection,
            delete_collection,
            get_prompt_collections,
            add_prompt_to_collection,
            remove_prompt_from_collection,
            get_collection_detail,
            toggle_favourite,
            get_favourites,
            is_favourite,
            is_daemon_alive
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
