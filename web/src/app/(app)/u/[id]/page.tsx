import Link from "next/link";
import { notFound } from "next/navigation";

import { demoGetUser, demoListPublicPromptsByUserId, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = demoNoDb
    ? demoGetUser(id)
    : await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, image: true, bio: true, createdAt: true },
      });
  if (!user) notFound();

  const prompts = demoNoDb
    ? demoListPublicPromptsByUserId(user.id)
    : await prisma.prompt.findMany({
        where: { userId: user.id, isPrivate: false },
        orderBy: [{ createdAt: "desc" }],
        take: 100,
      });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm text-foreground/70">
            <Link href="/store" className="underline underline-offset-4">
              Store
            </Link>{" "}
            <span className="mx-2">/</span>
            <span>Profile</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {user.name || "User"}
          </h1>
          {user.bio ? <p className="mt-2 text-sm text-foreground/70">{user.bio}</p> : null}
        </div>

        {prompts.length ? (
          <div className="grid gap-3">
            {prompts.map((p) => (
              <Link
                key={p.id}
                href={`/store/${p.id}`}
                className="rounded-2xl border border-black/10 bg-white p-5 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                <div className="truncate text-base font-semibold">{p.title}</div>
                <div className="mt-2 max-h-14 overflow-hidden text-sm text-foreground/80">
                  {p.content}
                </div>
                <div className="mt-3 text-xs text-foreground/60 tabular-nums">
                  uses: {p.useCount}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-foreground/70 dark:border-white/10 dark:bg-zinc-950">
            No public prompts yet.
          </div>
        )}
      </div>
    </div>
  );
}
