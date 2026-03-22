"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LibraryTabs() {
  const pathname = usePathname();

  const tab = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-md px-3 py-2 text-sm font-medium ${
          active
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "text-foreground/80 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
      {tab("/library", "All")}
      {tab("/library/favourites", "Favourites")}
      {tab("/library/collections", "Collections")}
    </div>
  );
}
