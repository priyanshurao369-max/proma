import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoClearVote, demoNoDb, demoVote } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const voteSchema = z.object({
  type: z.enum(["UP", "DOWN"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: promptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (demoNoDb) {
    const score = demoVote(userId, promptId, parsed.data.type);
    if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ promptId, score: score.score, up: score.up, down: score.down });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { id: true, isPrivate: true, userId: true },
  });
  if (!prompt || prompt.isPrivate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.vote.findUnique({
    where: { userId_promptId: { userId, promptId } },
  });

  if (existing && existing.type === parsed.data.type) {
    await prisma.vote.delete({ where: { userId_promptId: { userId, promptId } } });
  } else if (existing) {
    await prisma.vote.update({
      where: { userId_promptId: { userId, promptId } },
      data: { type: parsed.data.type },
    });
  } else {
    await prisma.vote.create({
      data: { userId, promptId, type: parsed.data.type },
    });
  }

  const score = await prisma.vote.groupBy({
    by: ["type"],
    where: { promptId },
    _count: { _all: true },
  });

  const up = score.find((s) => s.type === "UP")?._count._all ?? 0;
  const down = score.find((s) => s.type === "DOWN")?._count._all ?? 0;

  return NextResponse.json({ promptId, score: up - down, up, down });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: promptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    demoClearVote(userId, promptId);
    return NextResponse.json({ ok: true });
  }

  await prisma.vote.deleteMany({ where: { userId, promptId } });
  return NextResponse.json({ ok: true });
}
