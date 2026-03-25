"use client";

import { useState } from "react";

export function SyncTokenCard() {
  const [token, setToken] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sync/token", { method: "POST" });
      const json = (await res.json().catch(() => null)) as { token?: string; error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Failed to generate token");
        return;
      }
      setToken(json?.token ?? "");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      return;
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <div className="text-sm font-semibold">Desktop Sync Token</div>
      <div className="mt-1 text-sm text-foreground/70">
        Use this token in the desktop daemon to sync your prompts and expand shortcuts everywhere.
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void generate()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Generate Token
          </button>
          <button
            type="button"
            disabled={!token}
            onClick={() => void copy()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Copy
          </button>
        </div>

        {token ? (
          <textarea
            value={token}
            readOnly
            rows={3}
            className="w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-xs text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
          />
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
