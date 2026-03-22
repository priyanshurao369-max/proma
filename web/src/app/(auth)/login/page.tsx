"use client";

import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";

type Providers = Awaited<ReturnType<typeof getProviders>>;

export default function LoginPage() {
  const demoEmail = "rao@mail.com";
  const demoPassword = "1234";

  const [providers, setProviders] = useState<Providers>(null);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProviders().then(setProviders).catch(() => setProviders(null));
  }, []);

  const oauthProviders = useMemo(() => {
    if (!providers) return [];
    return Object.values(providers).filter((p) => p.id !== "credentials");
  }, [providers]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(json?.error ?? "Registration failed");
          return;
        }
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/library",
      });
    } finally {
      setBusy(false);
    }
  }

  async function enterDemoMode() {
    setError(null);
    setMode("signin");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setBusy(true);
    try {
      await signIn("credentials", {
        email: demoEmail,
        password: demoPassword,
        callbackUrl: "/library",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-foreground/80">
          Use OAuth (if configured) or email + password.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Demo mode</div>
              <div className="mt-1 text-xs text-foreground/70">
                Email: {demoEmail} • Password: {demoPassword}
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={enterDemoMode}
              className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Enter Demo
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === "signin"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === "register"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
          {mode === "register" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground/80">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/80">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/80">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={mode === "register" ? 8 : 4}
              className="h-10 rounded-md border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-zinc-950"
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {mode === "register" ? "Register & Sign in" : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          <div className="text-xs text-foreground/70">OR</div>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <div className="flex flex-col gap-2">
          {oauthProviders.length ? (
            oauthProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => signIn(p.id, { callbackUrl: "/library" })}
                className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                Continue with {p.name}
              </button>
            ))
          ) : (
            <div className="text-sm text-foreground/70">
              OAuth providers are not configured.
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-foreground/70">
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </div>
  );
}
