"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewCollectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Create failed");
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Collections</div>
          <div className="mt-1 text-sm text-foreground/70">
            Group prompts into folders for fast retrieval.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          {open ? "Close" : "New Collection"}
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-foreground/80">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-foreground/80">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !name.trim()}
              onClick={create}
              className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Create
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
