import Link from "next/link";

import { ImportButtons } from "@/components/ImportButtons";
import { VoteButtons } from "@/components/VoteButtons";
import { auth } from "@/lib/auth";
import { demoListStorePrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const sort = sp.sort === "recent" || sp.sort === "uses" ? sp.sort : "votes";
  const search = sp.search?.trim() || "";
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const pageSize = 20;

  const items = demoNoDb
    ? demoListStorePrompts({
        userId: session?.user?.id ?? null,
        sort,
        search,
        page,
        pageSize,
      }).prompts
    : await (async () => {
        const where = {
          isPrivate: false,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" as const } },
                  { content: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        };

        const prompts = await prisma.prompt.findMany({
          where,
          orderBy:
            sort === "recent"
              ? [{ createdAt: "desc" }]
              : sort === "uses"
                ? [{ useCount: "desc" }, { updatedAt: "desc" }]
                : [{ votes: { _count: "desc" } }, { updatedAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { votes: true } },
          },
        });

        const promptIds = prompts.map((p) => p.id);
        const grouped = promptIds.length
          ? await prisma.vote.groupBy({
              by: ["promptId", "type"],
              where: { promptId: { in: promptIds } },
              _count: { _all: true },
            })
          : [];

        const scoreByPromptId = new Map<string, { up: number; down: number }>();
        for (const g of grouped) {
          const current = scoreByPromptId.get(g.promptId) ?? { up: 0, down: 0 };
          if (g.type === "UP") current.up += g._count._all;
          if (g.type === "DOWN") current.down += g._count._all;
          scoreByPromptId.set(g.promptId, current);
        }

        const userVotes =
          session?.user?.id && promptIds.length
            ? await prisma.vote.findMany({
                where: { userId: session.user.id, promptId: { in: promptIds } },
                select: { promptId: true, type: true },
              })
            : [];
        const userVoteByPromptId = new Map(userVotes.map((v) => [v.promptId, v.type]));

        return prompts.map((p) => {
          const score = scoreByPromptId.get(p.id) ?? { up: 0, down: 0 };
          return {
            ...p,
            voteScore: score.up - score.down,
            userVote: userVoteByPromptId.get(p.id) ?? null,
          };
        });
      })();

  const sortLink = (value: "votes" | "recent" | "uses", label: string) => (
    <Link
      href={{
        pathname: "/store",
        query: {
          ...(search ? { search } : {}),
          ...(page !== 1 ? { page: String(page) } : {}),
          ...(value !== "votes" ? { sort: value } : {}),
        },
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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Store</h1>
          <p className="text-sm text-foreground/70">
            Browse public prompts, vote, and import copies into your library.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form className="flex w-full max-w-md items-center gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search store..."
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
            {sortLink("votes", "Top Voted")}
            {sortLink("recent", "Most Recent")}
            {sortLink("uses", "Most Used")}
          </div>
        </div>

        {items.length ? (
          <div className="grid gap-3">
            {items.map((p) => {
              const voteScore = (p.voteScore ?? 0) as number;
              const userVote = (p.userVote ?? null) as "UP" | "DOWN" | null;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <Link href={`/store/${p.id}`} className="truncate text-base font-semibold">
                        {p.title}
                      </Link>
                      <div className="mt-1 text-xs text-foreground/60">
                        by{" "}
                        <Link
                          href={`/u/${p.user.id}`}
                          className="underline underline-offset-4"
                        >
                          {p.user.name || "Unknown"}
                        </Link>
                        <span className="mx-2">•</span>
                        uses: {p.useCount}
                      </div>
                      <div className="mt-3 max-h-14 overflow-hidden text-sm text-foreground/80">
                        {p.content}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <VoteButtons
                        promptId={p.id}
                        initialScore={voteScore}
                        initialUserVote={session ? userVote : null}
                      />
                      {session ? <ImportButtons storePromptId={p.id} /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
            No prompts found.
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Link
            href={{
              pathname: "/store",
              query: { ...(search ? { search } : {}), ...(sort !== "votes" ? { sort } : {}), page: String(Math.max(1, page - 1)) },
            }}
            className={`rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 ${
              page === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Prev
          </Link>
          <div className="text-xs text-foreground/60">Page {page}</div>
          <Link
            href={{
              pathname: "/store",
              query: { ...(search ? { search } : {}), ...(sort !== "votes" ? { sort } : {}), page: String(page + 1) },
            }}
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
