import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoNoDb, demoUpdateMe } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

const updateMeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(280).optional(),
  image: z.string().url().optional(),
});

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateMeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (demoNoDb) {
    const user = demoUpdateMe(userId, parsed.data);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user: { id: user.id, name: user.name, bio: user.bio, image: user.image } });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, bio: true, image: true },
  });

  return NextResponse.json({ user });
}
