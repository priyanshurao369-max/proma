import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoIncrementUse, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const prompt = demoIncrementUse(userId, id);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt });
  }

  const existing = await prisma.prompt.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prompt = await prisma.prompt.update({
    where: { id },
    data: { useCount: { increment: 1 } },
  });

  return NextResponse.json({ prompt });
}
