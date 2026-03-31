"use client";

import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Proma
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/library"
            className="text-foreground/80 hover:text-foreground"
          >
            Library
          </Link>
          <Link
            href="/prompt/new"
            className="text-foreground/80 hover:text-foreground"
          >
            New Prompt
          </Link>
          <Link
            href="/connect"
            className="text-foreground/80 hover:text-foreground"
          >
            Desktop Agent
          </Link>
          <Link href="/store" className="text-foreground/80 hover:text-foreground">
            Store
          </Link>
        </nav>
      </div>
    </header>
  );
}
