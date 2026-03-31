"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FavouriteToggle } from "@/components/FavouriteToggle";
import { tauriGetFavourites, DecodedPrompt } from "@/lib/tauri-bridge";

export default function LibraryFavouritesPage() {
  const [favourites, setFavourites] = useState<DecodedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = async () => {
    try {
      const data = await tauriGetFavourites();
      setFavourites(data);
    } catch (err) {
      console.error("Failed to fetch favourites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-foreground/50">Loading favourites...</div>;
  }

  return favourites.length ? (
    <div className="grid gap-3">
      {favourites.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{p.title}</div>
              <div className="mt-2 max-h-14 overflow-hidden text-sm text-foreground/80">
                {p.content}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FavouriteToggle promptId={p.id} initial onSuccess={fetchFavourites} />
              <Link
                href={`/prompt/${p.id}/edit`}
                className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
      No favourites yet. Star a prompt from the All tab.
    </div>
  );
}
