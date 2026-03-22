"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveFromCollectionButton({
  collectionId,
  promptId,
}: {
  collectionId: string;
  promptId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/prompts/${promptId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={remove}
      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
    >
      Remove
    </button>
  );
}
