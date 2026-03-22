import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoNoDb, demoToggleFavourite } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, ctx: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    demoToggleFavourite(userId, promptId, false);
    return NextResponse.json({ ok: true });
  }

  await prisma.favourite.deleteMany({ where: { userId, promptId } });
  return NextResponse.json({ ok: true });
}
