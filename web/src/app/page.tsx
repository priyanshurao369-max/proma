import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16">
      <section className="rounded-2xl border border-black/10 bg-white p-10 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-4xl font-semibold tracking-tight">Save prompts once. Use them everywhere.</h1>
        <p className="mt-4 max-w-2xl text-base text-foreground/80">
          Proma is a prompt collection platform with a personal Library and a public Store. Manage,
          search, remix, and share prompts with your team or the community.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Open Library
          </Link>
          <Link
            href="/store"
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Browse Store
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Library</div>
          <div className="mt-2 text-sm text-foreground/80">
            Organize prompts into collections and favourites, and track usage.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Store</div>
          <div className="mt-2 text-sm text-foreground/80">
            Discover public prompts, vote, and import copies into your own library.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Shortcuts</div>
          <div className="mt-2 text-sm text-foreground/80">
            Assign multiple trigger keys per prompt (desktop agent integration planned).
          </div>
        </div>
      </section>
    </div>
  );
}
