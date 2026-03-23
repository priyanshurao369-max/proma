-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keys" TEXT[],
    "isPrivate" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptVersion_promptId_createdAt_idx" ON "PromptVersion"("promptId", "createdAt");

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
