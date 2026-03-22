"use client";

import { useState } from "react";

export function FavouriteToggle({
  promptId,
  initial,
}: {
  promptId: string;
  initial: boolean;
}) {
  const [isFav, setIsFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (isFav) {
        const res = await fetch(`/api/favourites/${promptId}`, { method: "DELETE" });
        if (res.ok) setIsFav(false);
      } else {
        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ promptId }),
        });
        if (res.ok) setIsFav(true);
      }
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
