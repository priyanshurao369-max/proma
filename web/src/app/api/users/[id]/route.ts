import { NextResponse } from "next/server";

import { demoGetUser, demoListPublicPromptsByUserId, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (demoNoDb) {
    const user = demoGetUser(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const prompts = demoListPublicPromptsByUserId(user.id).map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      keywords: p.keywords,
      useCount: p.useCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt,
        prompts,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      createdAt: true,
      prompts: {
        where: { isPrivate: false },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          content: true,
          keywords: true,
          useCount: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 100,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}
