use std::path::PathBuf;

pub fn proma_dir() -> PathBuf {
  dirs::home_dir()
    .unwrap_or_else(|| PathBuf::from("."))
    .join(".proma")
}

pub fn db_path() -> PathBuf {
  proma_dir().join("cache.db")
}

pub fn token_path() -> PathBuf {
  proma_dir().join("token.txt")
}

