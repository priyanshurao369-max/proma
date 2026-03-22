import Link from "next/link";
import { redirect } from "next/navigation";

import { NewCollectionForm } from "@/components/NewCollectionForm";
import { auth } from "@/lib/auth";
import { demoListCollections, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryCollectionsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const collections = demoNoDb
    ? demoListCollections(session.user.id)
    : await prisma.collection.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { prompts: true } } },
        take: 200,
      });

  return (
    <div className="flex flex-col gap-6">
      <NewCollectionForm />

      {collections.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/library/collections/${c.id}`}
              className="rounded-2xl border border-black/10 bg-white p-6 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <div className="text-base font-semibold">{c.name}</div>
              {c.description ? (
                <div className="mt-2 text-sm text-foreground/70">{c.description}</div>
              ) : null}
              <div className="mt-3 text-xs text-foreground/60 tabular-nums">
                prompts: {c._count.prompts}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
          No collections yet. Create one to start grouping prompts.
        </div>
      )}
    </div>
  );
}
