import Link from "next/link";
import { redirect } from "next/navigation";

import { FavouriteToggle } from "@/components/FavouriteToggle";
import { auth } from "@/lib/auth";
import { demoListFavourites, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryFavouritesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const favourites = demoNoDb
    ? demoListFavourites(session.user.id).map((f) => ({
        id: f.id,
        promptId: f.promptId,
        prompt: f.prompt,
      }))
    : await prisma.favourite.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { prompt: true },
        take: 200,
      });

  return favourites.length ? (
    <div className="grid gap-3">
      {favourites.map((f) => (
        <div
          key={f.id}
          className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{f.prompt.title}</div>
              <div className="mt-2 max-h-14 overflow-hidden text-sm text-foreground/80">
                {f.prompt.content}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FavouriteToggle promptId={f.promptId} initial />
              <Link
                href={`/prompt/${f.promptId}/edit`}
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
