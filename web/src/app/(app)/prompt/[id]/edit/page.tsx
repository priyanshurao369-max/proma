"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PromptForm } from "@/components/PromptForm";
import { tauriGetPrompts, DecodedPrompt } from "@/lib/tauri-bridge";

export default function EditPromptPage() {
  const params = useParams();
  const id = params?.id as string;
  const [prompt, setPrompt] = useState<DecodedPrompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    tauriGetPrompts().then(data => {
      const found = data.find(p => p.id === id);
      setPrompt(found || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-foreground/50">Loading...</div>;
  if (!prompt) return <div className="p-8 text-sm text-red-500">Prompt not found</div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Prompt</h1>
      <p className="mt-2 text-sm text-foreground/70">{prompt.id}</p>
      <div className="mt-6">
        <PromptForm
          mode="edit"
          promptId={prompt.id}
          initialValues={{
            content: prompt.content,
            keys: prompt.keys,
          }}
        />
      </div>
    </div>
  );
}
