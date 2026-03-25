use std::collections::HashMap;
use std::path::Path;

use rusqlite::{params, Connection};

use crate::types::PromptEntry;

pub fn ensure_db(path: &Path) -> rusqlite::Result<()> {
  let conn = Connection::open(path)?;
  conn.execute_batch(
    r#"
CREATE TABLE IF NOT EXISTS prompts (
  id      TEXT PRIMARY KEY,
  title   TEXT NOT NULL,
  content TEXT NOT NULL,
  keys    TEXT NOT NULL
);
"#,
  )?;
  Ok(())
}

pub fn save_prompts(path: &Path, rows: Vec<(PromptEntry, Vec<String>)>) -> rusqlite::Result<()> {
  let conn = Connection::open(path)?;
  let tx = conn.transaction()?;

  for (p, keys) in rows {
    let keys_json = serde_json::to_string(&keys).unwrap_or_else(|_| "[]".to_string());
    tx.execute(
      r#"
INSERT INTO prompts (id, title, content, keys)
VALUES (?1, ?2, ?3, ?4)
ON CONFLICT(id) DO UPDATE SET
  title=excluded.title,
  content=excluded.content,
  keys=excluded.keys
"#,
      params![p.id, p.title, p.content, keys_json],
    )?;
  }

  tx.commit()?;
  Ok(())
}

pub fn load_key_map(path: &Path) -> rusqlite::Result<HashMap<String, PromptEntry>> {
  let conn = Connection::open(path)?;
  let mut stmt = conn.prepare("SELECT id, title, content, keys FROM prompts")?;
  let mut rows = stmt.query([])?;

  let mut map = HashMap::new();

  while let Some(row) = rows.next()? {
    let id: String = row.get(0)?;
    let title: String = row.get(1)?;
    let content: String = row.get(2)?;
    let keys_json: String = row.get(3)?;
    let keys: Vec<String> = serde_json::from_str(&keys_json).unwrap_or_default();

    let entry = PromptEntry { id, title, content };
    for k in keys {
      let normalized = if k.starts_with('/') { k } else { format!("/{k}") };
      map.insert(normalized.to_lowercase(), entry.clone());
    }
  }

  Ok(map)
}

