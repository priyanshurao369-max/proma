"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function HeaderButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
    >
      {children}
    </button>
  );
}

export function AppHeader() {
  const session = useSession();
  const isAuthed = session.status === "authenticated";

  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Proma
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/store" className="text-foreground/80 hover:text-foreground">
            Store
          </Link>
          {isAuthed ? (
            <>
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
                Connect
              </Link>
              <Link
                href="/profile"
                className="text-foreground/80 hover:text-foreground"
              >
                Profile
              </Link>
              <HeaderButton onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </HeaderButton>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-foreground/80 hover:text-foreground"
              >
                Login
              </Link>
              <HeaderButton onClick={() => signIn(undefined, { callbackUrl: "/library" })}>
                Sign in
              </HeaderButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
