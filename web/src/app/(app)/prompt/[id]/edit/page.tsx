import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { demoGetOrCreatePrompt, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { PromptForm } from "@/components/PromptForm";

export const dynamic = "force-dynamic";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const prompt = demoNoDb
    ? demoGetOrCreatePrompt(session.user.id, id)
    : await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
      });
  if (!prompt) notFound();

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
            isPrivate: prompt.isPrivate,
          }}
        />
      </div>
    </div>
  );
}
