import Link from "next/link";
import { notFound } from "next/navigation";

import { ImportButtons } from "@/components/ImportButtons";
import { VoteButtons } from "@/components/VoteButtons";
import { auth } from "@/lib/auth";
import { demoGetStorePrompt, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StorePromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (demoNoDb) {
    const data = demoGetStorePrompt({ userId: session?.user?.id ?? null, promptId: id });
    if (!data) notFound();
    const prompt = data.prompt;
    const score = data.voteScore;
    const userVote = data.userVote;
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <div>
            <div className="text-sm text-foreground/70">
              <Link href="/store" className="underline underline-offset-4">
                Store
              </Link>{" "}
              <span className="mx-2">/</span>
              <span>{prompt.title}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{prompt.title}</h1>
            <div className="mt-2 text-sm text-foreground/70">
              by{" "}
              <Link href={`/u/${prompt.user.id}`} className="underline underline-offset-4">
                {prompt.user.name || "Unknown"}
              </Link>
              <span className="mx-2">•</span>
              uses: {prompt.useCount}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <pre className="whitespace-pre-wrap break-words text-sm">{prompt.content}</pre>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
            <VoteButtons
              promptId={prompt.id}
              initialScore={score}
              initialUserVote={userVote}
            />
            {session ? <ImportButtons storePromptId={prompt.id} /> : null}
          </div>
        </div>
      </div>
    );
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id, isPrivate: false },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  if (!prompt) notFound();

  const grouped = await prisma.vote.groupBy({
    by: ["type"],
    where: { promptId: prompt.id },
    _count: { _all: true },
  });
  const up = grouped.find((g) => g.type === "UP")?._count._all ?? 0;
  const down = grouped.find((g) => g.type === "DOWN")?._count._all ?? 0;
  const score = up - down;

  const userVote =
    session?.user?.id
      ? await prisma.vote.findUnique({
          where: { userId_promptId: { userId: session.user.id, promptId: prompt.id } },
          select: { type: true },
        })
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm text-foreground/70">
            <Link href="/store" className="underline underline-offset-4">
              Store
            </Link>{" "}
            <span className="mx-2">/</span>
            <span>{prompt.title}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{prompt.title}</h1>
          <div className="mt-2 text-sm text-foreground/70">
            by{" "}
            <Link href={`/u/${prompt.user.id}`} className="underline underline-offset-4">
              {prompt.user.name || "Unknown"}
            </Link>
            <span className="mx-2">•</span>
            uses: {prompt.useCount}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <pre className="whitespace-pre-wrap break-words text-sm">{prompt.content}</pre>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
          <VoteButtons
            promptId={prompt.id}
            initialScore={score}
            initialUserVote={(userVote?.type ?? null) as "UP" | "DOWN" | null}
          />
          {session ? <ImportButtons storePromptId={prompt.id} /> : null}
        </div>
      </div>
    </div>
  );
}
