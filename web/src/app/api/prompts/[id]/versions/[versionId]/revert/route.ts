import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoNoDb, demoRevertPromptVersion } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; versionId: string }> }) {
  const { id: promptId, versionId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const prompt = demoRevertPromptVersion(userId, promptId, versionId);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { id: true, userId: true, title: true, content: true, keys: true, isPrivate: true },
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prompt.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const version = await (prisma as unknown as { promptVersion: { findFirst: (args: unknown) => Promise<unknown> } }).promptVersion.findFirst({
    where: { id: versionId, promptId },
    select: { id: true, title: true, content: true, keys: true, isPrivate: true },
  });
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    await (tx as unknown as { promptVersion: { create: (args: unknown) => Promise<unknown> } }).promptVersion.create({
      data: {
        promptId: prompt.id,
        title: prompt.title,
        content: prompt.content,
        keys: prompt.keys,
        isPrivate: prompt.isPrivate,
      },
    });

    return tx.prompt.update({
      where: { id: promptId },
      data: {
        title: (version as { title: string }).title,
        content: (version as { content: string }).content,
        keys: (version as { keys: string[] }).keys,
        isPrivate: (version as { isPrivate: boolean }).isPrivate,
      },
    });
  });

  return NextResponse.json({ prompt: updated });
}
