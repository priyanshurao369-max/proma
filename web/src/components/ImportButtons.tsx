"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportButtons({ storePromptId }: { storePromptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function importPrompt(mode: "import" | "import_edit") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storePromptId}/import`, { method: "POST" });
      if (!res.ok) return;
      const json = (await res.json()) as { prompt: { id: string } };
      if (mode === "import_edit") {
        router.push(`/prompt/${json.prompt.id}/edit`);
      } else {
        router.push("/library");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => importPrompt("import")}
        className="inline-flex h-8 items-center justify-center rounded-md border border-black/10 bg-white px-2 text-xs font-medium text-black hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
      >
        Import
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => importPrompt("import_edit")}
        className="inline-flex h-8 items-center justify-center rounded-md bg-black px-2 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        Edit
      </button>
    </div>
  );
}
