import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth-helpers";
import { demoListStorePrompts, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "votes";
  const search = url.searchParams.get("search")?.trim() || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const pageSize = 20;

  if (demoNoDb) {
    const userId = await getSessionUserId();
    const data = demoListStorePrompts({
      userId,
      sort: sort === "recent" || sort === "uses" ? sort : "votes",
      search,
      page,
      pageSize,
    });
    return NextResponse.json(data);
  }

  const where = {
    isPrivate: false,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const prompts = await prisma.prompt.findMany({
    where,
    orderBy:
      sort === "recent"
        ? [{ createdAt: "desc" }]
        : sort === "uses"
          ? [{ useCount: "desc" }, { updatedAt: "desc" }]
          : [{ votes: { _count: "desc" } }, { updatedAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { votes: true } },
    },
  });

  const promptIds = prompts.map((p) => p.id);
  const grouped = promptIds.length
    ? await prisma.vote.groupBy({
        by: ["promptId", "type"],
        where: { promptId: { in: promptIds } },
        _count: { _all: true },
      })
    : [];

  const scoreByPromptId = new Map<string, { up: number; down: number }>();
  for (const g of grouped) {
    const current = scoreByPromptId.get(g.promptId) ?? { up: 0, down: 0 };
    if (g.type === "UP") current.up += g._count._all;
    if (g.type === "DOWN") current.down += g._count._all;
    scoreByPromptId.set(g.promptId, current);
  }

  const userId = await getSessionUserId();
  const userVotes =
    userId && promptIds.length
      ? await prisma.vote.findMany({
          where: { userId, promptId: { in: promptIds } },
          select: { promptId: true, type: true },
        })
      : [];
  const userVoteByPromptId = new Map(userVotes.map((v) => [v.promptId, v.type]));

  const items = prompts.map((p) => {
    const score = scoreByPromptId.get(p.id) ?? { up: 0, down: 0 };
    return {
      ...p,
      voteScore: score.up - score.down,
      upVotes: score.up,
      downVotes: score.down,
      userVote: userVoteByPromptId.get(p.id) ?? null,
    };
  });

  return NextResponse.json({ prompts: items, page, pageSize });
}
