import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoListPromptVersions, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: promptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const versions = demoListPromptVersions(userId, promptId);
    return NextResponse.json({ versions });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { userId: true },
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prompt.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const versions = await prisma.promptVersion.findMany({
    where: { promptId },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: { id: true, promptId: true, title: true, content: true, keys: true, isPrivate: true, createdAt: true },
  });

  return NextResponse.json({ versions });
}
