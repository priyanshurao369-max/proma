import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoFindPromptByKey, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  key: z.string().min(1),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const key = parsed.data.key.trim();
  if (!key) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const normalizedKey = key.startsWith("/") ? key : `/${key}`;

  if (demoNoDb) {
    const prompt = demoFindPromptByKey(userId, normalizedKey);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt: { id: prompt.id, title: prompt.title, content: prompt.content } });
  }

  const prompt = await prisma.prompt.findFirst({
    where: { userId, OR: [{ keys: { has: key } }, { keys: { has: normalizedKey } }] },
    select: { id: true, title: true, content: true },
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ prompt });
}
