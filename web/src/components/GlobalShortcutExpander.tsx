"use client";

import { useCallback, useEffect, useRef } from "react";

type ShortcutPrompt = { id: string; title: string; content: string };

function findTrailingShortcutToken(textBeforeCaret: string) {
  const match = textBeforeCaret.match(/(?:^|\s)(\/[A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

function isEditableTarget(target: EventTarget | null) {
  if (!target) return null;
  if (!(target instanceof HTMLElement)) return null;
  if (target instanceof HTMLTextAreaElement) return target;
  if (target instanceof HTMLInputElement) {
    const type = (target.getAttribute("type") ?? "text").toLowerCase();
    if (type === "password") return null;
    if (type === "email") return null;
    if (type === "number") return null;
    return target;
  }
  if (target.isContentEditable) return target;
  return null;
}

export function GlobalShortcutExpander() {
  const cacheRef = useRef(new Map<string, string | null>());
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const resolveShortcut = useCallback(async (key: string) => {
    const normalized = key.startsWith("/") ? key : `/${key}`;
    const cacheKey = normalized.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached !== undefined) return cached;

    const url = new URL("/api/prompts/by-key", window.location.origin);
    url.searchParams.set("key", normalized);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        cacheRef.current.set(cacheKey, null);
        return null;
      }
      const json = (await res.json()) as { prompt?: ShortcutPrompt };
      const content = (json.prompt?.content ?? "").toString();
      cacheRef.current.set(cacheKey, content);
      return content;
    } catch {
      return null;
    }
  }, []);

  const tryExpand = useCallback(
    async (el: HTMLTextAreaElement | HTMLInputElement | HTMLElement, trigger: "idle" | "space" | "enter" | "tab") => {
      if (inFlightRef.current) return;
      if (el.dataset.disableShortcuts === "true") return;

      let token: string | null = null;
      let replaceFrom = 0;
      let replaceTo = 0;

      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (start !== end) return;
        const before = el.value.slice(0, start);
        token = findTrailingShortcutToken(before);
        if (!token) return;
        replaceFrom = start - token.length;
        replaceTo = start;
      } else {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;
        const node = sel.anchorNode;
        if (!node) return;
        if (!el.contains(node)) return;
        if (node.nodeType !== Node.TEXT_NODE) return;
        const textNode = node as Text;
        const offset = sel.anchorOffset ?? 0;
        const before = (textNode.nodeValue ?? "").slice(0, offset);
        token = findTrailingShortcutToken(before);
        if (!token) return;
        replaceFrom = offset - token.length;
        replaceTo = offset;
      }

      inFlightRef.current = true;
      try {
        const replacement = await resolveShortcut(token);
        if (replacement === null && trigger === "idle") return;

        const suffix = trigger === "space" ? " " : trigger === "enter" ? "\n" : trigger === "tab" ? " " : "";
        const base = replacement === null ? token : replacement;
        const insert = `${base}${suffix}`;

        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          el.setRangeText(insert, replaceFrom, replaceTo, "end");
          el.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const node = sel.anchorNode;
          if (!node || node.nodeType !== Node.TEXT_NODE) return;
          const textNode = node as Text;
          const r = document.createRange();
          r.setStart(textNode, replaceFrom);
          r.setEnd(textNode, replaceTo);
          r.deleteContents();
          r.insertNode(document.createTextNode(insert));
          sel.removeAllRanges();
          const afterRange = document.createRange();
          const newNode = r.endContainer;
          if (newNode.nodeType === Node.TEXT_NODE) {
            afterRange.setStart(newNode, (newNode as Text).length);
          } else {
            afterRange.setStartAfter(newNode);
          }
          afterRange.collapse(true);
          sel.addRange(afterRange);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [resolveShortcut],
  );

  useEffect(() => {
    function schedule(el: HTMLTextAreaElement | HTMLInputElement | HTMLElement, trigger: "idle" | "space" | "enter" | "tab") {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void tryExpand(el, trigger);
      }, trigger === "idle" ? 250 : 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.isComposing) return;
      const el = isEditableTarget(e.target);
      if (!el) return;
      if (el.dataset.disableShortcuts === "true") return;

      const isTriggered =
        (e.key === " " || e.key === "Enter" || e.key === "Tab") &&
        !e.shiftKey &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey;
      if (!isTriggered) return;

      let hasToken = false;
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        const caret = el.selectionStart ?? 0;
        const before = el.value.slice(0, caret);
        hasToken = !!findTrailingShortcutToken(before);
      } else {
        const sel = window.getSelection();
        const node = sel?.anchorNode ?? null;
        if (sel && node && sel.rangeCount > 0 && sel.getRangeAt(0).collapsed && el.contains(node) && node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text;
          const before = (textNode.nodeValue ?? "").slice(0, sel.anchorOffset ?? 0);
          hasToken = !!findTrailingShortcutToken(before);
        }
      }
      if (!hasToken) return;

      e.preventDefault();
      const trigger = e.key === " " ? "space" : e.key === "Enter" ? "enter" : "tab";
      schedule(el, trigger);
    }

    function onInput(e: Event) {
      const el = isEditableTarget(e.target);
      if (!el) return;
      if (el.dataset.disableShortcuts === "true") return;
      schedule(el, "idle");
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("input", onInput);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tryExpand]);

  return null;
}
