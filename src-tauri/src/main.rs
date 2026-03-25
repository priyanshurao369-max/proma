mod cache;
mod injector;
mod paths;
mod sync;
mod types;
mod watcher;

use std::sync::{Arc, Mutex};

use watcher::WatcherState;

fn main() {
  let dir = paths::proma_dir();
  let _ = std::fs::create_dir_all(&dir);

  let db_path = paths::db_path();
  let token_path = paths::token_path();

  let _ = cache::ensure_db(&db_path);
  let initial_map = cache::load_key_map(&db_path).unwrap_or_default();

  let state = Arc::new(Mutex::new(WatcherState {
    buffer: String::new(),
    key_map: initial_map,
  }));

  let reload_state = state.clone();
  sync::run_periodic_sync(token_path, db_path.clone(), move || {
    if let Ok(map) = cache::load_key_map(&db_path) {
      if let Ok(mut s) = reload_state.lock() {
        s.key_map = map;
      }
    }
  });

  let _ = watcher::start_watcher(state);
}
