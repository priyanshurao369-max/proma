"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PromptVersion = {
  id: string;
  promptId: string;
  title: string;
  content: string;
  keys: string[];
  isPrivate: boolean;
  createdAt: string | Date;
};

function formatTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function PromptVersionHistory({ promptId }: { promptId: string }) {
  const router = useRouter();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [busy, setBusy] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const items = useMemo(() => versions.slice(0, 20), [versions]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`, { cache: "no-store" });
      if (!res.ok) {
        setVersions([]);
        return;
      }
      const json = (await res.json()) as { versions?: PromptVersion[] };
      setVersions(json.versions ?? []);
    } finally {
      setBusy(false);
    }
  }, [promptId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revert(versionId: string) {
    if (revertingId) return;
    setRevertingId(versionId);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions/${versionId}/revert`, {
        method: "POST",
      });
      if (!res.ok) return;
      await load();
      router.refresh();
    } finally {
      setRevertingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Version history</div>
          <div className="mt-1 text-sm text-foreground/70">
            Every edit is saved. Revert if needed.
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 bg-white px-3 text-xs font-medium text-black hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {busy ? (
          <div className="text-sm text-foreground/70">Loading…</div>
        ) : items.length ? (
          items.map((v) => (
            <div
              key={v.id}
              className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950 md:flex-row md:items-start md:justify-between"
            >
              <div className="min-w-0">
                <div className="text-xs text-foreground/60">{formatTime(v.createdAt)}</div>
                <div className="mt-1 truncate text-sm font-semibold">{v.title || "Untitled"}</div>
                <div className="mt-1 max-h-10 overflow-hidden text-xs text-foreground/70">
                  {v.content}
                </div>
              </div>
              <button
                type="button"
                disabled={revertingId === v.id}
                onClick={() => void revert(v.id)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Revert
              </button>
            </div>
          ))
        ) : (
          <div className="text-sm text-foreground/70">No versions yet.</div>
        )}
      </div>
    </div>
  );
}
