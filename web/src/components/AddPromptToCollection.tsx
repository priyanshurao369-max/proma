"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PromptListItem = {
  id: string;
  title: string;
  content: string;
  keys: string[];
  isPrivate: boolean;
  useCount: number;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function AddPromptToCollection({
  collectionId,
  existingPromptIds,
}: {
  collectionId: string;
  existingPromptIds: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [results, setResults] = useState<PromptListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const existing = useMemo(() => new Set(existingPromptIds), [existingPromptIds]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setBusy(false);
        setHasSearched(false);
        return;
      }

      setHasSearched(true);
      setError(null);
      setBusy(true);
      try {
        const url = new URL("/api/prompts", window.location.origin);
        url.searchParams.set("sort", "recent");
        url.searchParams.set("search", debouncedQuery.trim());
        const res = await fetch(url.toString());
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { prompts: PromptListItem[] };
        if (cancelled) return;
        const filtered = (json.prompts ?? []).filter((p) => !existing.has(p.id));
        setResults(filtered.slice(0, 10));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, existing]);

  async function add(promptId: string) {
    if (addingId) return;
    setError(null);
    setAddingId(promptId);
    try {
      const res = await fetch(`/api/collections/${collectionId}/prompts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Failed to add prompt");
        return;
      }
      router.refresh();
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Add prompts</div>
          <div className="mt-1 text-sm text-foreground/70">
            Search your library and add prompts to this collection.
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your prompts..."
          className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm md:max-w-sm dark:border-white/10 dark:bg-zinc-950"
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {!hasSearched ? null : busy ? (
          <div className="text-sm text-foreground/70">Searching…</div>
        ) : results.length ? (
          results.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950 md:flex-row md:items-start md:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="mt-1 max-h-10 overflow-hidden text-xs text-foreground/70">
                  {p.content}
                </div>
              </div>
              <button
                type="button"
                disabled={addingId === p.id}
                onClick={() => add(p.id)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Add
              </button>
            </div>
          ))
        ) : (
          <div className="text-sm text-foreground/70">
            No prompts found.
          </div>
        )}
      </div>
    </div>
  );
}
