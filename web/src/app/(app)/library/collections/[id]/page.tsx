"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AddPromptToCollection } from "@/components/AddPromptToCollection";
import { RemoveFromCollectionButton } from "@/components/RemoveFromCollectionButton";
import { tauriGetCollectionDetail, CollectionDetail } from "@/lib/tauri-bridge";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const data = await tauriGetCollectionDetail(id);
      setCollection(data);
    } catch (err) {
      console.error(err);
      setError("Collection not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-foreground/50">Loading collection...</div>;
  if (error || !collection) return <div className="p-8 text-sm text-red-500">{error || "Not found"}</div>;

  const existingPromptIds = collection.prompts.map((p) => p.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{collection.name}</h2>
          {collection.description ? (
            <div className="mt-2 text-sm text-foreground/70">{collection.description}</div>
          ) : null}
        </div>
      </div>

      <AddPromptToCollection
        collectionId={collection.id}
        existingPromptIds={existingPromptIds}
        onSuccess={fetchData}
      />

      {collection.prompts.length ? (
        <div className="grid gap-3">
          {collection.prompts.map((p) => (
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
                  <RemoveFromCollectionButton
                    collectionId={collection.id}
                    promptId={p.id}
                    onSuccess={fetchData}
                  />
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
          No prompts in this collection yet.
        </div>
      )}
    </div>
  );
}
