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

  // Migration: Add is_private column if it doesn't exist
  let _ = conn.execute("ALTER TABLE prompts ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT 0", []);
  
  Ok(())
}

pub fn save_prompts(path: &Path, rows: Vec<(PromptEntry, Vec<String>)>) -> rusqlite::Result<()> {
  let mut conn = Connection::open(path)?;
  let tx = conn.transaction()?;

  // Clear existing prompts to ensure deletions on web app are reflected locally
  tx.execute("DELETE FROM prompts", [])?;

  for (p, keys) in rows {
    let keys_json = serde_json::to_string(&keys).unwrap_or_else(|_| "[]".to_string());
    tx.execute(
      r#"
INSERT INTO prompts (id, title, content, keys, is_private)
VALUES (?1, ?2, ?3, ?4, ?5)
"#,
      params![p.id, p.title, p.content, keys_json, p.is_private],
    )?;
  }

  tx.commit()?;
  Ok(())
}

pub fn load_key_map(path: &Path) -> rusqlite::Result<HashMap<String, PromptEntry>> {
  let conn = Connection::open(path)?;
  let mut stmt = conn.prepare("SELECT id, title, content, keys, is_private FROM prompts")?;
  let mut rows = stmt.query([])?;

  let mut map = HashMap::new();

  while let Some(row) = rows.next()? {
    let id: String = row.get(0)?;
    let title: String = row.get(1)?;
    let content: String = row.get(2)?;
    let keys_json: String = row.get(3)?;
    let is_private: bool = row.get(4)?;
    let keys: Vec<String> = serde_json::from_str(&keys_json).unwrap_or_default();

    let entry = PromptEntry {
      id,
      title,
      content,
      is_private,
    };
    for k in keys {
      let normalized = if k.starts_with('/') { k } else { format!("/{k}") };
      map.insert(normalized.to_lowercase(), entry.clone());
    }
  }

  Ok(map)
}

