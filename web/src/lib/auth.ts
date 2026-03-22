import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

import { demoGetCurrentUser, demoNoDb } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function seedDemoData(userId: string) {
  const existingPromptCount = await prisma.prompt.count({ where: { userId } });
  if (existingPromptCount > 0) return;

  const prompts = await Promise.all([
    prisma.prompt.create({
      data: {
        userId,
        title: "Fix My Code",
        content:
          "You are a senior software engineer. Fix the bug, explain the root cause, and propose a clean refactor. Keep the answer concise and include the final code.",
        keywords: ["code", "debug", "fix"],
        keys: ["/fix", "/correct"],
        isPrivate: false,
        useCount: 12,
      },
    }),
    prisma.prompt.create({
      data: {
        userId,
        title: "Summarize",
        content:
          "Summarize the following text into 5 bullet points. Preserve key numbers, names, and decisions.\n\nTEXT:\n{{text}}",
        keywords: ["summarize", "writing"],
        keys: ["/sum", "/summarize"],
        isPrivate: false,
        useCount: 7,
      },
    }),
    prisma.prompt.create({
      data: {
        userId,
        title: "Rewrite (Friendly)",
        content:
          "Rewrite the following message to sound friendly, professional, and direct. Keep it under 120 words.\n\nMESSAGE:\n{{text}}",
        keywords: ["rewrite", "email"],
        keys: ["/friendly", "/rewrite"],
        isPrivate: false,
        useCount: 4,
      },
    }),
    prisma.prompt.create({
      data: {
        userId,
        title: "Private Scratchpad",
        content: "Internal notes. Not visible in the Store.",
        keywords: ["private"],
        keys: ["/scratch"],
        isPrivate: true,
        useCount: 1,
      },
    }),
  ]);

  const coding = prompts.find((p) => p.title === "Fix My Code");
  const summarize = prompts.find((p) => p.title === "Summarize");
  const rewrite = prompts.find((p) => p.title === "Rewrite (Friendly)");

  const createdCollections = await Promise.all([
    prisma.collection.create({
      data: { userId, name: "Coding", description: "Debugging and refactoring prompts" },
    }),
    prisma.collection.create({
      data: { userId, name: "Writing", description: "Summaries, rewrites, and communication" },
    }),
  ]);

  const codingCollection = createdCollections.find((c) => c.name === "Coding");
  const writingCollection = createdCollections.find((c) => c.name === "Writing");

  const joins: Array<{ collectionId: string; promptId: string }> = [];
  if (codingCollection && coding) joins.push({ collectionId: codingCollection.id, promptId: coding.id });
  if (writingCollection && summarize) joins.push({ collectionId: writingCollection.id, promptId: summarize.id });
  if (writingCollection && rewrite) joins.push({ collectionId: writingCollection.id, promptId: rewrite.id });

  if (joins.length) {
    await prisma.collectionPrompt.createMany({ data: joins, skipDuplicates: true });
  }

  if (coding) {
    await prisma.favourite.createMany({
      data: [{ userId, promptId: coding.id }],
      skipDuplicates: true,
    });
  }

  const authorEmail = "proma-demo-author@mail.com";
  const author = await prisma.user.upsert({
    where: { email: authorEmail },
    update: { name: "Proma Team" },
    create: { email: authorEmail, name: "Proma Team" },
    select: { id: true },
  });

  const authorPrompts = await Promise.all([
    prisma.prompt.create({
      data: {
        userId: author.id,
        title: "Bug Report Template",
        content:
          "Write a high-quality bug report.\n\nInclude:\n- Expected vs actual\n- Repro steps\n- Minimal reproduction\n- Environment\n- Logs/screenshots\n\nBUG:\n{{bug}}",
        keywords: ["template", "bug", "qa"],
        keys: [],
        isPrivate: false,
        useCount: 30,
      },
    }),
    prisma.prompt.create({
      data: {
        userId: author.id,
        title: "Product Spec Outline",
        content:
          "Create a product spec outline with: Problem, Goals, Non-goals, User stories, UX, Data model, API, Edge cases, Rollout, Metrics.",
        keywords: ["product", "spec"],
        keys: [],
        isPrivate: false,
        useCount: 18,
      },
    }),
  ]);

  for (const p of authorPrompts) {
    await prisma.vote.upsert({
      where: { userId_promptId: { userId, promptId: p.id } },
      update: { type: "UP" },
      create: { userId, promptId: p.id, type: "UP" },
    });
  }
}

export const authOptions: NextAuthOptions = {
  ...(demoNoDb ? {} : { adapter: PrismaAdapter(prisma) }),
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
  ...(demoNoDb ? { session: { strategy: "jwt" } } : {}),
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const demoEmail = "rao@mail.com";
        const demoPassword = "1234";
        const demoAllowed =
          process.env.DEMO_MODE === "true" ||
          process.env.NODE_ENV !== "production" ||
          demoNoDb;

        if (
          demoAllowed &&
          credentials?.email === demoEmail &&
          credentials?.password === demoPassword
        ) {
          if (demoNoDb) {
            const u = demoGetCurrentUser();
            return { id: u.id, name: u.name, email: u.email, image: u.image };
          }

          const passwordHash = await hashPassword(demoPassword);
          const demoUser = await prisma.user.upsert({
            where: { email: demoEmail },
            update: { name: "Rao (Demo)", passwordHash },
            create: { email: demoEmail, name: "Rao (Demo)", passwordHash },
            select: { id: true, name: true, email: true, image: true },
          });

          await seedDemoData(demoUser.id);

          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            image: demoUser.image,
          };
        }

        if (demoNoDb) return null;

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(!demoNoDb && process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    ...(!demoNoDb && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (user?.name) token.name = user.name;
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        const id = (token?.sub ?? user?.id ?? session.user.id) as string;
        session.user.id = id;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
