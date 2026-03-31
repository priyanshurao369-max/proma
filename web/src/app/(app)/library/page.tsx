"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeletePromptButton } from "@/components/DeletePromptButton";
import { FavouriteToggle } from "@/components/FavouriteToggle";
import { tauriGetPrompts, DecodedPrompt } from "@/lib/tauri-bridge";

export default function LibraryAllPage() {
  const [prompts, setPrompts] = useState<DecodedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "mostUsed">("recent");

  const fetchPrompts = async () => {
    try {
      const data = await tauriGetPrompts();
      setPrompts(data);
    } catch (err) {
      console.error("Failed to fetch prompts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const filteredPrompts = prompts
    .filter((p) => {
      const searchText = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(searchText) ||
        p.content.toLowerCase().includes(searchText) ||
        p.keys.some(k => k.toLowerCase().includes(searchText))
      );
    })
    .sort(() => {
      // Already sorted by created_at in Rust
      return 0;
    });

  if (loading) {
    return <div className="p-8 text-sm text-foreground/50">Loading prompts...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-md items-center gap-2">
          <input
            placeholder="Search prompts... (or /shortcut)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSort("recent")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              sort === "recent"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 bg-white text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            }`}
          >
            Recently Added
          </button>
        </div>
      </div>

      {filteredPrompts.length ? (
        <div className="grid gap-3">
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-semibold">{p.title}</div>
                  </div>
                  <div className="mt-2 text-sm text-foreground/80 line-clamp-2">
                    {p.content}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FavouriteToggle promptId={p.id} initial={false} />
                  <Link
                    href={`/prompt/${p.id}/edit`}
                    className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  >
                    Edit
                  </Link>
                  <DeletePromptButton promptId={p.id} onSuccess={fetchPrompts} />
                </div>
              </div>
              {p.keys.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.keys.map((k) => (
                    <div
                      key={k}
                      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-zinc-950"
                    >
                      {k}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
          No prompts found.{" "}
          <Link href="/prompt/new" className="underline underline-offset-4">
            Create a prompt
          </Link>
          .
        </div>
      )}
    </div>
  );
}
