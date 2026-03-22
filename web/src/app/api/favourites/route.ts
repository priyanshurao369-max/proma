import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoGetPrompt, demoListFavourites, demoNoDb, demoToggleFavourite } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const favouriteSchema = z.object({
  promptId: z.string().min(1),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const favourites = demoListFavourites(userId);
    return NextResponse.json({ favourites });
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      prompt: true,
    },
  });

  return NextResponse.json({ favourites });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = favouriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (demoNoDb) {
    const prompt = demoGetPrompt(parsed.data.promptId);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (prompt.isPrivate && prompt.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const favourite = demoToggleFavourite(userId, prompt.id, true);
    return NextResponse.json({ favourite }, { status: 201 });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    select: { id: true, isPrivate: true, userId: true },
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prompt.isPrivate && prompt.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const favourite = await prisma.favourite.upsert({
    where: { userId_promptId: { userId, promptId: prompt.id } },
    update: {},
    create: { userId, promptId: prompt.id },
  });

  return NextResponse.json({ favourite }, { status: 201 });
}
