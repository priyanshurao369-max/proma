import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { demoListSyncPrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function GET(req: Request) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  let userId: string | null = null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.typ !== "proma-sync") throw new Error("Bad token type");
    userId = typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (demoNoDb) {
    const prompts = demoListSyncPrompts(userId);
    return NextResponse.json({ prompts });
  }

  const prompts = await prisma.prompt.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      keys: true,
      isPrivate: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ prompts });
}
