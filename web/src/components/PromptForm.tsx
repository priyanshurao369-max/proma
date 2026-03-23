"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PromptFormValues = {
  content: string;
  keys: string[];
  isPrivate: boolean;
};

function joinTags(tags: string[]) {
  return tags.join(", ");
}

function splitTags(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function PromptForm({
  mode,
  promptId,
  initialValues,
}: {
  mode: "create" | "edit";
  promptId?: string;
  initialValues?: Partial<PromptFormValues>;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const shortcutCacheRef = useRef(new Map<string, string>());
  const expandTimerRef = useRef<number | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveReadyRef = useRef(false);
  const lastSavedRef = useRef<string>("");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [keysText, setKeysText] = useState(joinTags(initialValues?.keys ?? []));
  const [isPrivate, setIsPrivate] = useState(initialValues?.isPrivate ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveShortcut(key: string) {
    const normalized = key.startsWith("/") ? key : `/${key}`;
    const cached = shortcutCacheRef.current.get(normalized.toLowerCase());
    if (cached !== undefined) return cached;

    const url = new URL("/api/prompts/by-key", window.location.origin);
    url.searchParams.set("key", normalized);
    const res = await fetch(url.toString());
    if (!res.ok) {
      shortcutCacheRef.current.set(normalized.toLowerCase(), "");
      return "";
    }
    const json = (await res.json()) as { prompt?: { content?: string } };
    const text = (json.prompt?.content ?? "").toString();
    shortcutCacheRef.current.set(normalized.toLowerCase(), text);
    return text;
  }

  function findTrailingShortcutToken(textBeforeCaret: string) {
    const match = textBeforeCaret.match(/(?:^|\s)(\/[A-Za-z0-9_-]+)$/);
    return match?.[1] ?? null;
  }

  async function expandShortcut(trigger: "space" | "enter" | "tab" | "idle") {
    const el = contentRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? 0;
    const before = el.value.slice(0, caret);
    const token = findTrailingShortcutToken(before);
    if (!token) return;

    const start = caret - token.length;
    const end = caret;
    const replacement = await resolveShortcut(token);

    const after = el.value.slice(end);
    const insert =
      trigger === "space"
        ? replacement
          ? `${replacement} `
          : `${token} `
        : trigger === "enter"
          ? replacement
            ? `${replacement}\n`
            : `${token}\n`
          : trigger === "tab"
            ? replacement
              ? `${replacement} `
              : `${token} `
            : replacement
              ? replacement
              : token;
    const nextValue = `${el.value.slice(0, start)}${insert}${after}`;
    setContent(nextValue);

    requestAnimationFrame(() => {
      const nextCaret = start + insert.length;
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
  }

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) {
        window.clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, []);

  function scheduleIdleExpand() {
    if (expandTimerRef.current) window.clearTimeout(expandTimerRef.current);
    expandTimerRef.current = window.setTimeout(() => {
      void expandShortcut("idle");
    }, 300);
  }

  useEffect(() => {
    if (mode !== "edit" || !promptId) return;
    if (!autosaveReadyRef.current) {
      lastSavedRef.current = JSON.stringify({
        content,
        keys: splitTags(keysText),
        isPrivate,
      });
      autosaveReadyRef.current = true;
      return;
    }

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      const snapshot = JSON.stringify({
        content,
        keys: splitTags(keysText),
        isPrivate,
      });
      if (snapshot === lastSavedRef.current) return;

      try {
        const res = await fetch(`/api/prompts/${promptId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-proma-skip-version": "1" },
          body: snapshot,
        });
        if (!res.ok) return;
        lastSavedRef.current = snapshot;
      } catch {
        return;
      }
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [content, isPrivate, keysText, mode, promptId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const payload: PromptFormValues = {
        content,
        keys: splitTags(keysText),
        isPrivate,
      };

      const res = await fetch(mode === "create" ? "/api/prompts" : `/api/prompts/${promptId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Save failed");
        return;
      }

      await res.json().catch(() => null);
      window.location.assign("/library");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="grid gap-4">
        <div className="grid gap-1 text-sm">
          <input
            value={keysText}
            onChange={(e) => setKeysText(e.target.value)}
            placeholder="Shortcut (/fix, /summarize)"
            className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
          />
        </div>

        <div className="grid gap-1 text-sm">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              scheduleIdleExpand();
            }}
            onKeyDown={(e) => {
              const el = contentRef.current;
              if (!el) return;

              const caret = el.selectionStart ?? 0;
              const before = el.value.slice(0, caret);
              const token = findTrailingShortcutToken(before);
              if (!token) return;

              if (e.key === " " && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                void expandShortcut("space");
                return;
              }
              if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                void expandShortcut("enter");
                return;
              }
              if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                void expandShortcut("tab");
              }
            }}
            required
            rows={10}
            placeholder="Write your prompt…"
            className="resize-y rounded-md border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm">
            <div className="font-medium">Visibility</div>
            <div className="text-xs text-foreground/70">
              {isPrivate ? "Private (only you)" : "Public (appears in Store)"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            {isPrivate ? "Make Public" : "Make Private"}
          </button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {mode === "create" ? "Create Prompt" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
