import { auth } from "@/lib/auth";

export async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
