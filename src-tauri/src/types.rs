use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SyncPrompt {
  pub id: String,
  pub title: String,
  pub content: String,
  pub keys: Vec<String>,
  #[serde(rename = "isPrivate")]
  pub is_private: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SyncResponse {
  pub prompts: Vec<SyncPrompt>,
}

#[derive(Clone, Debug)]
pub struct PromptEntry {
  pub id: String,
  pub title: String,
  pub content: String,
  pub is_private: bool,
}
