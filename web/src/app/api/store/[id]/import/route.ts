import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoImportPrompt, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: storePromptId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const imported = demoImportPrompt(userId, storePromptId);
    if (!imported) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt: imported }, { status: 201 });
  }

  const prompt = await prisma.prompt.findUnique({ where: { id: storePromptId } });
  if (!prompt || prompt.isPrivate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const imported = await prisma.prompt.create({
    data: {
      userId,
      title: prompt.title,
      content: prompt.content,
      keywords: prompt.keywords,
      keys: [],
      isPrivate: false,
      importedFromId: prompt.id,
    },
  });

  return NextResponse.json({ prompt: imported }, { status: 201 });
}
