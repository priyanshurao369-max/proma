import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoFindPromptByKey, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  key: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const key = parsed.data.key.trim();
  if (!key) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const normalizedKey = key.startsWith("/") ? key : `/${key}`;

  if (demoNoDb) {
    const userId = await getSessionUserId();
    const own = userId ? demoFindPromptByKey(userId, normalizedKey) : null;
    const prompt =
      own ??
      // fallback to any public prompt with this key in demo mode
      (() => {
        type DemoPrompt = { id: string; title: string; content: string; isPrivate: boolean; keys: string[] };
        const p = (globalThis as unknown as { __promaDemoState?: { prompts: DemoPrompt[] } }).__promaDemoState?.prompts;
        return p?.find((x) => !x.isPrivate && x.keys.some((k) => k.toLowerCase() === normalizedKey.toLowerCase())) ?? null;
      })();
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt: { id: prompt.id, title: prompt.title, content: prompt.content } });
  }

  const userId = await getSessionUserId();

  const prompt = await prisma.prompt.findFirst({
    where: {
      OR: [
        ...(userId
          ? [{ AND: [{ userId }, { OR: [{ keys: { has: key } }, { keys: { has: normalizedKey } }] }] }]
          : []),
        { AND: [{ isPrivate: false }, { OR: [{ keys: { has: key } }, { keys: { has: normalizedKey } }] }] },
      ],
    },
    select: { id: true, title: true, content: true },
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ prompt });
}
