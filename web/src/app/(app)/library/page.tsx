import Link from "next/link";
import { redirect } from "next/navigation";

import { FavouriteToggle } from "@/components/FavouriteToggle";
import { auth } from "@/lib/auth";
import { demoFindPromptByKey, demoListFavourites, demoListOwnPrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryAllPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const sort = sp.sort === "mostUsed" ? "mostUsed" : "recent";
  const search = sp.search?.trim() || "";
  const searchText = search.startsWith("/") ? search.slice(1).trim() : search;

  if (search.startsWith("/") && search.length > 1) {
    const key = search.split(/\s+/)[0];
    const prompt = demoNoDb
      ? demoFindPromptByKey(session.user.id, key)
      : await prisma.prompt.findFirst({
          where: { userId: session.user.id, keys: { has: key } },
          select: { id: true },
        });
    if (prompt) redirect(`/prompt/${prompt.id}/edit`);
  }

  const favourites = demoNoDb
    ? demoListFavourites(session.user.id).map((f) => ({ promptId: f.promptId }))
    : await prisma.favourite.findMany({
        where: { userId: session.user.id },
        select: { promptId: true },
      });
  const favSet = new Set(favourites.map((f) => f.promptId));

  const prompts = demoNoDb
    ? demoListOwnPrompts({ userId: session.user.id, sort, search: searchText })
    : await prisma.prompt.findMany({
        where: {
          userId: session.user.id,
          ...(searchText
            ? {
                OR: [
                  { title: { contains: searchText, mode: "insensitive" } },
                  { content: { contains: searchText, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy:
          sort === "mostUsed"
            ? [{ useCount: "desc" }, { updatedAt: "desc" }]
            : [{ createdAt: "desc" }],
        take: 200,
      });

  const sortButton = (value: "recent" | "mostUsed", label: string) => (
    <Link
      href={{
        pathname: "/library",
        query: { ...(search ? { search } : {}), sort: value === "recent" ? undefined : value },
      }}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        sort === value
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border border-black/10 bg-white text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form className="flex w-full max-w-md items-center gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search prompts... (or /shortcut)"
            className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          {sortButton("recent", "Recently Added")}
          {sortButton("mostUsed", "Most Used")}
        </div>
      </div>

      {prompts.length ? (
        <div className="grid gap-3">
          {prompts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-semibold">{p.title}</div>
                    <div className="text-xs text-foreground/60 tabular-nums">
                      uses: {p.useCount}
                    </div>
                    {p.isPrivate ? (
                      <div className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                        Private
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 max-h-14 overflow-hidden text-sm text-foreground/80">
                    {p.content}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FavouriteToggle promptId={p.id} initial={favSet.has(p.id)} />
                  <Link
                    href={`/prompt/${p.id}/edit`}
                    className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  >
                    Edit
                  </Link>
                </div>
              </div>
              {p.keys.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.keys.slice(0, 8).map((k) => (
                    <div
                      key={k}
                      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-zinc-950"
                    >
                      {k}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
          No prompts yet.{" "}
          <Link href="/prompt/new" className="underline underline-offset-4">
            Create your first prompt
          </Link>
          .
        </div>
      )}
    </div>
  );
}
