"use client";

import { useEffect, useState } from "react";
import { tauriIsDaemonAlive } from "@/lib/tauri-bridge";

export default function ConnectPage() {
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const alive = await tauriIsDaemonAlive();
      setIsActive(alive);
    };
    
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Desktop Agent</h1>
          <p className="mt-2 text-sm text-foreground/70">
            The ProMa desktop agent is built directly into this application.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isActive === null ? "bg-zinc-400 animate-pulse" : isActive ? "bg-emerald-500" : "bg-red-500"
            }`} />
            <h2 className="text-sm font-semibold text-foreground/90">
              Status: {isActive === null ? "Checking..." : isActive ? "Active" : "Disconnected"}
            </h2>
          </div>
          <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
            {isActive ? (
              <>The agent is currently listening for your prompt shortcuts (e.g., <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">/fix</code> followed by <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Space</kbd> or <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Tab</kbd>) across all your applications.</>
            ) : isActive === false ? (
              <span className="text-red-400">The background agent is not responding. Please try restarting the application.</span>
            ) : (
              "Initializing system-wide listener..."
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-foreground/90">How it works</h2>
          <div className="mt-4 text-xs text-foreground/60 leading-loose">
            <ul className="list-inside list-disc space-y-2">
              <li>Open any text editor, browser, or coding tool.</li>
              <li>Type one of your configured shortcuts (like /refactor).</li>
              <li>Press <strong>Space</strong> or <strong>Tab</strong> to immediately expand it into the full prompt.</li>
              <li>Shortcuts are case-insensitive and synced instantly when you save changes in the Library.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-foreground/90">Troubleshooting</h2>
          <div className="mt-4 text-xs text-foreground/60 leading-loose">
            <ul className="list-inside list-disc space-y-2">
              <li>**Permissions**: Ensure the app has permission to listen to keyboard events (Accessibility on macOS, or run as Admin if needed on Windows).</li>
              <li>**Conflict**: If a shortcut doesn&apos;t expand, check if another app is intercepting the keys.</li>
              <li>**Logs**: Technical logs are saved to the app&apos;s local data directory.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
