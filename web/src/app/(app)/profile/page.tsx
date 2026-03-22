import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/ProfileForm";
import { auth } from "@/lib/auth";
import { demoGetUser, demoListOwnPrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = demoNoDb
    ? (() => {
        const u = demoGetUser(session.user.id);
        if (!u) return null;
        const prompts = demoListOwnPrompts({ userId: u.id, sort: "recent", search: "" });
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          bio: u.bio,
          createdAt: u.createdAt,
          prompts: prompts.map((p) => ({ isPrivate: p.isPrivate, useCount: p.useCount })),
        };
      })()
    : await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          createdAt: true,
          prompts: { select: { isPrivate: true, useCount: true } },
        },
      });
  if (!user) redirect("/login");

  const promptCount = user.prompts.length;
  const publicCount = user.prompts.filter((p) => !p.isPrivate).length;
  const totalUses = user.prompts.reduce((sum, p) => sum + p.useCount, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Manage your public profile and visibility.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950 md:grid-cols-3">
          <div>
            <div className="text-xs text-foreground/60">Prompts</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{promptCount}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">Public</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{publicCount}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">Total Uses</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{totalUses}</div>
          </div>
          <div className="md:col-span-3 text-sm text-foreground/70">
            Public URL:{" "}
            <Link href={`/u/${user.id}`} className="underline underline-offset-4">
              /u/{user.id}
            </Link>
          </div>
        </div>

        <ProfileForm
          initialName={user.name ?? ""}
          initialBio={user.bio ?? ""}
        />
      </div>
    </div>
  );
}
