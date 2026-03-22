import { LibraryTabs } from "@/components/LibraryTabs";

export const dynamic = "force-dynamic";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-foreground/70">
            Your prompts, favourites, and collections.
          </p>
        </div>
        <LibraryTabs />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
