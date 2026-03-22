import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoAddPromptToCollection, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const addPromptSchema = z.object({
  promptId: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const body = await req.json().catch(() => null);
    const parsed = addPromptSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const join = demoAddPromptToCollection(userId, collectionId, parsed.data.promptId);
    if (!join) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ collectionPrompt: join }, { status: 201 });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = addPromptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    select: { id: true, userId: true },
  });
  if (!prompt || prompt.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const join = await prisma.collectionPrompt.upsert({
    where: { collectionId_promptId: { collectionId, promptId: prompt.id } },
    update: {},
    create: { collectionId, promptId: prompt.id },
  });

  return NextResponse.json({ collectionPrompt: join }, { status: 201 });
}
