import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PromptForm } from "@/components/PromptForm";

export const dynamic = "force-dynamic";

export default async function NewPromptPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">New Prompt</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Add a title, content, tags, and one or more trigger keys.
      </p>
      <div className="mt-6">
        <PromptForm mode="create" />
      </div>
    </div>
  );
}
