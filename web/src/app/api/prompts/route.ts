import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoCreatePrompt, demoListOwnPrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const createPromptSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1),
  keywords: z.array(z.string().min(1).max(40)).default([]),
  keys: z.array(z.string().min(1).max(40)).default([]),
  isPrivate: z.boolean().default(false),
});

function deriveTitleFromContent(content: string) {
  const firstLine = content.split(/\r?\n/)[0]?.trim() ?? "";
  const base = firstLine || content.trim().slice(0, 80) || "Untitled";
  return base.length > 120 ? base.slice(0, 120) : base;
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort");
  const search = url.searchParams.get("search")?.trim() || "";

  if (demoNoDb) {
    const prompts = demoListOwnPrompts({
      userId,
      sort: sort === "mostUsed" ? "mostUsed" : "recent",
      search,
    });
    return NextResponse.json({ prompts });
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "mostUsed" ? [{ useCount: "desc" }, { updatedAt: "desc" }] : [{ createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createPromptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const title = parsed.data.title ?? deriveTitleFromContent(parsed.data.content);
  const normalizedKeys = parsed.data.keys
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => (k.startsWith("/") ? k : `/${k}`));

  const uniqueKeys = Array.from(new Set(normalizedKeys));

  if (demoNoDb) {
    const prompt = demoCreatePrompt(userId, {
      title,
      content: parsed.data.content,
      keywords: parsed.data.keywords.map((k) => k.trim()).filter(Boolean),
      keys: uniqueKeys,
      isPrivate: parsed.data.isPrivate,
    });
    return NextResponse.json({ prompt }, { status: 201 });
  }

  const prompt = await prisma.prompt.create({
    data: {
      userId,
      title,
      content: parsed.data.content,
      keywords: parsed.data.keywords.map((k) => k.trim()).filter(Boolean),
      keys: uniqueKeys,
      isPrivate: parsed.data.isPrivate,
    },
  });

  return NextResponse.json({ prompt }, { status: 201 });
}
