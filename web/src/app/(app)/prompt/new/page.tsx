"use client";

import { PromptForm } from "@/components/PromptForm";

export default function NewPromptPage() {
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
