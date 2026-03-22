import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoCreateCollection, demoListCollections, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const createCollectionSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const collections = demoListCollections(userId);
    return NextResponse.json({ collections });
  }

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { prompts: true } } },
  });

  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (demoNoDb) {
    const collection = demoCreateCollection(userId, {
      name: parsed.data.name,
      description: parsed.data.description,
    });
    return NextResponse.json({ collection }, { status: 201 });
  }

  const collection = await prisma.collection.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
