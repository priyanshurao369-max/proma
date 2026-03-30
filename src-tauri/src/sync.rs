use std::env;
use std::fs;
use std::path::Path;
use std::time::Duration;

use reqwest::blocking::Client;

use crate::types::{PromptEntry, SyncPrompt, SyncResponse};

fn normalize_keys(keys: &[String]) -> Vec<String> {
  keys
    .iter()
    .map(|k| k.trim().to_string())
    .filter(|k| !k.is_empty())
    .map(|k| if k.starts_with('/') { k } else { format!("/{k}") })
    .collect()
}

pub fn sync_url() -> String {
  env::var("PROMA_SYNC_URL").unwrap_or_else(|_| "http://localhost:3000/api/sync/prompts".to_string())
}

pub fn sync_interval_secs() -> u64 {
  env::var("PROMA_SYNC_INTERVAL_SECS")
    .ok()
    .and_then(|v| v.parse::<u64>().ok())
    .unwrap_or(300)
}

pub fn read_token(token_path: &Path) -> Option<String> {
  fs::read_to_string(token_path)
    .ok()
    .map(|t| t.trim().to_string())
    .filter(|t| !t.is_empty())
}

pub fn run_periodic_sync(
  token_path: impl AsRef<Path>,
  db_path: impl AsRef<Path>,
  on_update: impl Fn() + Send + Sync + 'static,
) {
  let token_path = token_path.as_ref().to_path_buf();
  let db_path = db_path.as_ref().to_path_buf();
  let on_update = std::sync::Arc::new(on_update);

  std::thread::spawn(move || loop {
    if let Some(token) = read_token(&token_path) {
      let _ = sync_once(&token, &db_path);
      on_update();
    }
    std::thread::sleep(Duration::from_secs(sync_interval_secs()));
  });
}

pub fn sync_once(token: &str, db_path: &Path) -> Result<(), String> {
  let client = Client::builder()
    .timeout(Duration::from_secs(15))
    .build()
    .map_err(|e| e.to_string())?;

  let res = client
    .get(sync_url())
    .bearer_auth(token)
    .send()
    .map_err(|e| e.to_string())?;

  if !res.status().is_success() {
    return Err(format!("sync failed: {}", res.status()));
  }

  let body = res.json::<SyncResponse>().map_err(|e| e.to_string())?;
  let rows = body
    .prompts
    .into_iter()
    .map(|p: SyncPrompt| {
      let keys = normalize_keys(&p.keys);
      (
        PromptEntry {
          id: p.id,
          title: p.title,
          content: p.content,
          is_private: p.is_private,
        },
        keys,
      )
    })
    .collect::<Vec<_>>();

  crate::cache::save_prompts(db_path, rows).map_err(|e| e.to_string())?;
  Ok(())
}

