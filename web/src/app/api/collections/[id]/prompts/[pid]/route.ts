import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoNoDb, demoRemovePromptFromCollection } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; pid: string }> },
) {
  const { id: collectionId, pid: promptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const ok = demoRemovePromptFromCollection(userId, collectionId, promptId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.collectionPrompt.deleteMany({
    where: { collectionId, promptId },
  });

  return NextResponse.json({ ok: true });
}
