import { redirect } from "next/navigation";
import { SyncTokenCard } from "@/components/SyncTokenCard";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connect Desktop Agent</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Sync your prompts to any application on your computer.
          </p>
        </div>

        <SyncTokenCard />

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-foreground/90">How to Setup</h2>
          
          <div className="mt-6 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                  1
                </div>
                <h3 className="text-sm font-medium">Build the Agent</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed ps-9">
                Navigate to the <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">src-tauri</code> directory in this project and build the Rust daemon.
              </p>
              <div className="ps-9">
                <pre className="rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5">
                  <code>cd src-tauri{"\n"}cargo build --release</code>
                </pre>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                  2
                </div>
                <h3 className="text-sm font-medium">Add your Token</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed ps-9">
                Create a folder named <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.proma</code> in your home directory and save the token generated above into a file called <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">token.txt</code>.
              </p>
              <div className="ps-9">
                <pre className="rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5">
                  <code># Windows (PowerShell){"\n"}mkdir ~\.proma -Force{"\n"}echo &quot;YOUR_TOKEN&quot; &gt; ~\.proma\token.txt</code>
                </pre>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                  3
                </div>
                <h3 className="text-sm font-medium">Run and Use</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed ps-9">
                Run the agent. It will sit in the background and watch for your prompt shortcuts (e.g., <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">/fix</code> followed by <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Space</kbd> or <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Enter</kbd>).
              </p>
              <div className="ps-9">
                <pre className="rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5">
                  <code>./target/release/proma-daemon</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-foreground/90">Troubleshooting</h2>
          <div className="mt-4 text-xs text-foreground/60 leading-loose">
            <ul className="list-inside list-disc space-y-2">
              <li>Ensure the agent has permission to listen to keyboard events (Accessibility on macOS).</li>
              <li>The agent syncs every 5 minutes by default. Restart it to sync immediately.</li>
              <li>Check the terminal logs for any &quot;Unauthorized&quot; or connection errors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
