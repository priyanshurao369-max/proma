import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { getSessionUserId } from "@/lib/auth-helpers";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const token = await new SignJWT({ userId, typ: "proma-sync" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json({ token });
}
