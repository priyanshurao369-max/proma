import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AddPromptToCollection } from "@/components/AddPromptToCollection";
import { RemoveFromCollectionButton } from "@/components/RemoveFromCollectionButton";
import { auth } from "@/lib/auth";
import { demoGetCollection, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const collection = demoNoDb
    ? demoGetCollection(session.user.id, id)
    : await prisma.collection.findFirst({
        where: { id, userId: session.user.id },
        include: {
          prompts: {
            orderBy: { addedAt: "desc" },
            include: { prompt: true },
          },
        },
      });
  if (!collection) notFound();

  const existingPromptIds = collection.prompts.map((cp) => cp.promptId);

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
      />

      {collection.prompts.length ? (
        <div className="grid gap-3">
          {collection.prompts.map((cp) => (
            <div
              key={`${cp.collectionId}:${cp.promptId}`}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">{cp.prompt.title}</div>
                  <div className="mt-2 max-h-14 overflow-hidden text-sm text-foreground/80">
                    {cp.prompt.content}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RemoveFromCollectionButton
                    collectionId={collection.id}
                    promptId={cp.promptId}
                  />
                  <Link
                    href={`/prompt/${cp.promptId}/edit`}
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
