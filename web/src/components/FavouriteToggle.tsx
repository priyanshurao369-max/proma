"use client";

import { useEffect, useState } from "react";
import { tauriIsFavourite, tauriToggleFavourite } from "@/lib/tauri-bridge";

export function FavouriteToggle({
  promptId,
  initial,
  onSuccess,
}: {
  promptId: string;
  initial: boolean;
  onSuccess?: () => void;
}) {
  const [isFav, setIsFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    tauriIsFavourite(promptId).then(setIsFav).catch(console.error);
  }, [promptId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await tauriToggleFavourite(promptId);
      setIsFav(next);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
    >
      {isFav ? "Favourited" : "Favourite"}
    </button>
  );
}
