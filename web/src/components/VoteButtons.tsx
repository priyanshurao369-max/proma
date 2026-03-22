"use client";

import { useState } from "react";

export function VoteButtons({
  promptId,
  initialScore,
  initialUserVote,
}: {
  promptId: string;
  initialScore: number;
  initialUserVote: "UP" | "DOWN" | null;
}) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(initialUserVote);
  const [busy, setBusy] = useState(false);

  async function vote(type: "UP" | "DOWN") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { score: number; up: number; down: number };
      setScore(json.score);
      setUserVote((prev) => (prev === type ? null : type));
    } finally {
      setBusy(false);
    }
  }

  const base =
    "inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs font-medium disabled:opacity-60";
  const inactive =
    "border-black/10 bg-white text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900";
  const active =
    "border-black bg-black text-white hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => vote("UP")}
        className={`${base} ${userVote === "UP" ? active : inactive}`}
      >
        Up
      </button>
      <div className="min-w-10 text-center text-xs tabular-nums text-foreground/80">
        {score}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => vote("DOWN")}
        className={`${base} ${userVote === "DOWN" ? active : inactive}`}
      >
        Down
      </button>
    </div>
  );
}
