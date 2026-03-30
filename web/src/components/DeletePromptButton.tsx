"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeletePromptButton({ promptId }: { promptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function onDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onDelete}
      className={`rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${
        confirm ? "text-red-500 border-red-500/50" : "text-black dark:text-white"
      }`}
    >
      {busy ? "Deleting..." : confirm ? "Confirm Delete?" : "Delete"}
    </button>
  );
}
