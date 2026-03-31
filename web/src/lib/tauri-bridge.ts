import { invoke } from "@tauri-apps/api/core";

export interface Prompt {
  id: string;
  title: string;
  content: string;
  keys: string; // JSON string from Rust
}

export interface DecodedPrompt {
  id: string;
  title: string;
  content: string;
  keys: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CollectionDetail {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  prompts: DecodedPrompt[];
}

export async function tauriGetPrompts(): Promise<DecodedPrompt[]> {
  const raw = await invoke<Prompt[]>("get_prompts");
  return raw.map((p: Prompt) => ({
    ...p,
    keys: JSON.parse(p.keys)
  }));
}

export async function tauriCreatePrompt(prompt: DecodedPrompt): Promise<void> {
  await invoke("create_prompt", {
    ...prompt,
    keys: prompt.keys
  });
}

export async function tauriUpdatePrompt(prompt: DecodedPrompt): Promise<void> {
  await invoke("update_prompt", {
    ...prompt,
    keys: prompt.keys
  });
}

export async function tauriDeletePrompt(id: string): Promise<void> {
  await invoke("delete_prompt", { id });
}

// ── Collection Commands ─────────────────────────────────────────────────────

export async function tauriGetCollections(): Promise<Collection[]> {
  return await invoke<Collection[]>("get_collections");
}

export async function tauriGetCollectionDetail(id: string): Promise<CollectionDetail> {
  const raw = await invoke<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    prompts: Prompt[];
  }>("get_collection_detail", { id });

  return {
    ...raw,
    prompts: raw.prompts.map((p: Prompt) => ({
      ...p,
      keys: JSON.parse(p.keys)
    }))
  };
}

export async function tauriCreateCollection(collection: Collection): Promise<void> {
  await invoke("create_collection", {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    icon: collection.icon
  });
}

export async function tauriDeleteCollection(id: string): Promise<void> {
  await invoke("delete_collection", { id });
}

export async function tauriGetPromptCollections(promptId: string): Promise<Collection[]> {
  return await invoke<Collection[]>("get_prompt_collections", { promptId });
}

export async function tauriAddPromptToCollection(promptId: string, collectionId: string): Promise<void> {
  await invoke("add_prompt_to_collection", { promptId, collectionId });
}

export async function tauriRemovePromptFromCollection(promptId: string, collectionId: string): Promise<void> {
  await invoke("remove_prompt_from_collection", { promptId, collectionId });
}

// ── Favourite Commands ──────────────────────────────────────────────────────

export async function tauriToggleFavourite(promptId: string): Promise<boolean> {
  return await invoke<boolean>("toggle_favourite", { promptId });
}

export async function tauriGetFavourites(): Promise<DecodedPrompt[]> {
  const raw = await invoke<Prompt[]>("get_favourites");
  return raw.map((p: Prompt) => ({
    ...p,
    keys: JSON.parse(p.keys)
  }));
}

export async function tauriIsFavourite(promptId: string): Promise<boolean> {
  return await invoke<boolean>("is_favourite", { promptId });
}

export async function tauriIsDaemonAlive(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_daemon_alive");
  } catch {
    return false;
  }
}
