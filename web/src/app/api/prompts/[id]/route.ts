import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoDeletePrompt, demoGetPrompt, demoGetUser, demoNoDb, demoUpdatePrompt } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const updatePromptSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).optional(),
  keywords: z.array(z.string().min(1).max(40)).optional(),
  keys: z.array(z.string().min(1).max(40)).optional(),
  isPrivate: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();

  if (demoNoDb) {
    const prompt = demoGetPrompt(id);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (prompt.isPrivate && prompt.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const user = demoGetUser(prompt.userId);
    return NextResponse.json({
      prompt: {
        ...prompt,
        user: user ? { id: user.id, name: user.name, image: user.image } : null,
        _count: { votes: 0 },
      },
    });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { votes: true } },
    },
  });

  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (prompt.isPrivate && prompt.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const body = await req.json().catch(() => null);
    const parsed = updatePromptSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const prompt = demoUpdatePrompt(userId, id, {
      title: parsed.data.title,
      content: parsed.data.content,
      keywords: parsed.data.keywords?.map((k) => k.trim()).filter(Boolean),
      keys: parsed.data.keys?.map((k) => k.trim()).filter(Boolean),
      isPrivate: parsed.data.isPrivate,
    });
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt });
  }

  const existing = await prisma.prompt.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = updatePromptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.keys) {
    const normalizedKeys = parsed.data.keys
      .map((k) => k.trim())
      .filter(Boolean)
      .map((k) => (k.startsWith("/") ? k : `/${k}`));
    data.keys = Array.from(new Set(normalizedKeys));
  }
  if (parsed.data.keywords) {
    data.keywords = parsed.data.keywords.map((k) => k.trim()).filter(Boolean);
  }

  const prompt = await prisma.prompt.update({
    where: { id },
    data,
  });

  return NextResponse.json({ prompt });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const ok = demoDeletePrompt(userId, id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.prompt.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.prompt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
