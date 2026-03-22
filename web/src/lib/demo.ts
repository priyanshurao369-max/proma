import crypto from "crypto";

type VoteType = "UP" | "DOWN";

export const demoNoDb = process.env.DEMO_MODE_NO_DB === "true";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: Date;
};

export type DemoPrompt = {
  id: string;
  userId: string;
  title: string;
  content: string;
  keywords: string[];
  keys: string[];
  isPrivate: boolean;
  useCount: number;
  importedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoCollection = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DemoFavourite = {
  id: string;
  userId: string;
  promptId: string;
  createdAt: Date;
};

type DemoVote = {
  id: string;
  userId: string;
  promptId: string;
  type: VoteType;
  createdAt: Date;
};

type DemoCollectionPrompt = {
  collectionId: string;
  promptId: string;
  addedAt: Date;
};

type DemoState = {
  users: Map<string, DemoUser>;
  prompts: DemoPrompt[];
  collections: DemoCollection[];
  collectionPrompts: DemoCollectionPrompt[];
  favourites: DemoFavourite[];
  votes: DemoVote[];
};

function now() {
  return new Date();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeKeys(keys: string[]) {
  const normalized = keys
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => (k.startsWith("/") ? k : `/${k}`));
  return Array.from(new Set(normalized));
}

const demoUser: DemoUser = {
  id: "demo_user",
  name: "Rao (Demo)",
  email: "rao@mail.com",
  image: null,
  bio: "Demo account for exploring Proma.",
  createdAt: now(),
};

const authorUser: DemoUser = {
  id: "demo_author",
  name: "Proma Team",
  email: "proma-demo-author@mail.com",
  image: null,
  bio: "Official starter prompts for the Store demo.",
  createdAt: now(),
};

function createInitialState(): DemoState {
  const t = now();

  const users = new Map<string, DemoUser>([
    [demoUser.id, demoUser],
    [authorUser.id, authorUser],
  ]);

  const prompts: DemoPrompt[] = [
    {
      id: "p_sry",
      userId: demoUser.id,
      title: "Apology",
      content:
        "I’m sorry. You’re right to feel that way.\n\nHere’s what I can do next:\n- Acknowledge what happened\n- Fix it\n- Prevent it from happening again",
      keywords: [],
      keys: ["/sry"],
      isPrivate: false,
      useCount: 3,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "p_fix",
      userId: demoUser.id,
      title: "Fix My Code",
      content:
        "You are a senior software engineer. Fix the bug, explain the root cause, and propose a clean refactor. Keep the answer concise and include the final code.",
      keywords: ["code", "debug", "fix"],
      keys: ["/fix", "/correct"],
      isPrivate: false,
      useCount: 12,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "p_sum",
      userId: demoUser.id,
      title: "Summarize",
      content:
        "Summarize the following text into 5 bullet points. Preserve key numbers, names, and decisions.\n\nTEXT:\n{{text}}",
      keywords: ["summarize", "writing"],
      keys: ["/sum", "/summarize"],
      isPrivate: false,
      useCount: 7,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "p_rewrite",
      userId: demoUser.id,
      title: "Rewrite (Friendly)",
      content:
        "Rewrite the following message to sound friendly, professional, and direct. Keep it under 120 words.\n\nMESSAGE:\n{{text}}",
      keywords: ["rewrite", "email"],
      keys: ["/friendly", "/rewrite"],
      isPrivate: false,
      useCount: 4,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "p_private",
      userId: demoUser.id,
      title: "Private Scratchpad",
      content: "Internal notes. Not visible in the Store.",
      keywords: ["private"],
      keys: ["/scratch"],
      isPrivate: true,
      useCount: 1,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "s_bug",
      userId: authorUser.id,
      title: "Bug Report Template",
      content:
        "Write a high-quality bug report.\n\nInclude:\n- Expected vs actual\n- Repro steps\n- Minimal reproduction\n- Environment\n- Logs/screenshots\n\nBUG:\n{{bug}}",
      keywords: ["template", "bug", "qa"],
      keys: [],
      isPrivate: false,
      useCount: 30,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "s_spec",
      userId: authorUser.id,
      title: "Product Spec Outline",
      content:
        "Create a product spec outline with: Problem, Goals, Non-goals, User stories, UX, Data model, API, Edge cases, Rollout, Metrics.",
      keywords: ["product", "spec"],
      keys: [],
      isPrivate: false,
      useCount: 18,
      importedFromId: null,
      createdAt: t,
      updatedAt: t,
    },
  ];

  const collections: DemoCollection[] = [
    {
      id: "c_coding",
      userId: demoUser.id,
      name: "Coding",
      description: "Debugging and refactoring prompts",
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "c_writing",
      userId: demoUser.id,
      name: "Writing",
      description: "Summaries, rewrites, and communication",
      createdAt: t,
      updatedAt: t,
    },
  ];

  const collectionPrompts: DemoCollectionPrompt[] = [
    { collectionId: "c_coding", promptId: "p_fix", addedAt: t },
    { collectionId: "c_writing", promptId: "p_sum", addedAt: t },
    { collectionId: "c_writing", promptId: "p_rewrite", addedAt: t },
  ];

  const favourites: DemoFavourite[] = [
    { id: "f_1", userId: demoUser.id, promptId: "p_fix", createdAt: t },
  ];

  const votes: DemoVote[] = [
    { id: "v_1", userId: demoUser.id, promptId: "s_bug", type: "UP", createdAt: t },
    { id: "v_2", userId: demoUser.id, promptId: "s_spec", type: "UP", createdAt: t },
  ];

  return { users, prompts, collections, collectionPrompts, favourites, votes };
}

const globalForDemo = globalThis as unknown as { __promaDemoState?: DemoState };
const state = globalForDemo.__promaDemoState ?? (globalForDemo.__promaDemoState = createInitialState());

export function demoGetUser(userId: string) {
  return state.users.get(userId) ?? null;
}

export function demoGetCurrentUser() {
  return demoUser;
}

export function demoUpdateMe(userId: string, data: Partial<Pick<DemoUser, "name" | "bio" | "image">>) {
  const user = state.users.get(userId);
  if (!user) return null;
  const next: DemoUser = {
    ...user,
    name: data.name ?? user.name,
    bio: data.bio ?? user.bio,
    image: data.image ?? user.image,
  };
  state.users.set(userId, next);
  return next;
}

export function demoListOwnPrompts(opts: { userId: string; sort: "recent" | "mostUsed"; search: string }) {
  return state.prompts
    .filter((p) => p.userId === opts.userId)
    .filter((p) => {
      if (!opts.search) return true;
      const s = opts.search.toLowerCase();
      return (
        p.title.toLowerCase().includes(s) ||
        p.content.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (opts.sort === "mostUsed") {
        if (b.useCount !== a.useCount) return b.useCount - a.useCount;
      } else {
        if (b.createdAt.getTime() !== a.createdAt.getTime()) return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, 200);
}

export function demoListSyncPrompts(userId: string) {
  return state.prompts
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      keys: p.keys,
      isPrivate: p.isPrivate,
      updatedAt: p.updatedAt,
    }));
}

export function demoCreatePrompt(userId: string, data: Omit<DemoPrompt, "id" | "userId" | "createdAt" | "updatedAt" | "importedFromId" | "useCount"> & { useCount?: number }) {
  const t = now();
  const prompt: DemoPrompt = {
    id: id("p"),
    userId,
    title: data.title,
    content: data.content,
    keywords: data.keywords,
    keys: normalizeKeys(data.keys),
    isPrivate: data.isPrivate,
    useCount: data.useCount ?? 0,
    importedFromId: null,
    createdAt: t,
    updatedAt: t,
  };
  state.prompts.unshift(prompt);
  return prompt;
}

export function demoGetPrompt(id: string) {
  return state.prompts.find((p) => p.id === id) ?? null;
}

export function demoFindPromptByKey(userId: string, key: string) {
  const normalized = key.startsWith("/") ? key : `/${key}`;
  return (
    state.prompts.find(
      (p) => p.userId === userId && p.keys.some((k) => k.toLowerCase() === normalized.toLowerCase()),
    ) ?? null
  );
}

export function demoGetOrCreatePrompt(userId: string, promptId: string) {
  const existing = demoGetPrompt(promptId);
  if (existing) return existing.userId === userId ? existing : null;

  const t = now();
  const created: DemoPrompt = {
    id: promptId,
    userId,
    title: "Untitled",
    content: "",
    keywords: [],
    keys: [],
    isPrivate: true,
    useCount: 0,
    importedFromId: null,
    createdAt: t,
    updatedAt: t,
  };
  state.prompts.unshift(created);
  return created;
}

export function demoListPublicPromptsByUserId(userId: string) {
  return state.prompts
    .filter((p) => p.userId === userId && !p.isPrivate)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 100);
}

export function demoUpdatePrompt(userId: string, promptId: string, data: Partial<Pick<DemoPrompt, "title" | "content" | "keywords" | "keys" | "isPrivate">>) {
  const p = demoGetPrompt(promptId);
  if (!p || p.userId !== userId) return null;
  const next: DemoPrompt = {
    ...p,
    title: data.title ?? p.title,
    content: data.content ?? p.content,
    keywords: data.keywords ?? p.keywords,
    keys: data.keys ? normalizeKeys(data.keys) : p.keys,
    isPrivate: data.isPrivate ?? p.isPrivate,
    updatedAt: now(),
  };
  const idx = state.prompts.findIndex((x) => x.id === promptId);
  if (idx !== -1) state.prompts[idx] = next;
  return next;
}

export function demoDeletePrompt(userId: string, promptId: string) {
  const p = demoGetPrompt(promptId);
  if (!p || p.userId !== userId) return false;
  state.prompts.splice(
    state.prompts.findIndex((x) => x.id === promptId),
    1,
  );
  state.favourites = state.favourites.filter((f) => f.promptId !== promptId);
  state.votes = state.votes.filter((v) => v.promptId !== promptId);
  state.collectionPrompts = state.collectionPrompts.filter((cp) => cp.promptId !== promptId);
  return true;
}

export function demoIncrementUse(userId: string, promptId: string) {
  const p = demoGetPrompt(promptId);
  if (!p || p.userId !== userId) return null;
  const idx = state.prompts.findIndex((x) => x.id === promptId);
  if (idx === -1) return null;
  const next: DemoPrompt = {
    ...state.prompts[idx],
    useCount: state.prompts[idx].useCount + 1,
    updatedAt: now(),
  };
  state.prompts[idx] = next;
  return next;
}

export function demoToggleFavourite(userId: string, promptId: string, on: boolean) {
  const existing = state.favourites.find((f) => f.userId === userId && f.promptId === promptId);
  if (on) {
    if (existing) return existing;
    const fav: DemoFavourite = { id: id("f"), userId, promptId, createdAt: now() };
    state.favourites.unshift(fav);
    return fav;
  }
  if (!existing) return null;
  state.favourites = state.favourites.filter((f) => f.id !== existing.id);
  return null;
}

export function demoListFavourites(userId: string) {
  return state.favourites
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((f) => ({
      ...f,
      prompt: demoGetPrompt(f.promptId),
    }))
    .filter((x): x is DemoFavourite & { prompt: DemoPrompt } => Boolean(x.prompt));
}

export function demoListCollections(userId: string) {
  return state.collections
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((c) => ({
      ...c,
      _count: {
        prompts: state.collectionPrompts.filter((cp) => cp.collectionId === c.id).length,
      },
    }));
}

export function demoCreateCollection(userId: string, data: { name: string; description?: string }) {
  const t = now();
  const c: DemoCollection = {
    id: id("c"),
    userId,
    name: data.name,
    description: data.description ?? null,
    createdAt: t,
    updatedAt: t,
  };
  state.collections.unshift(c);
  return c;
}

export function demoGetCollection(userId: string, collectionId: string) {
  const c = state.collections.find((x) => x.id === collectionId && x.userId === userId) ?? null;
  if (!c) return null;
  const cps = state.collectionPrompts
    .filter((cp) => cp.collectionId === c.id)
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
    .map((cp) => ({ ...cp, prompt: demoGetPrompt(cp.promptId) }))
    .filter((x): x is DemoCollectionPrompt & { prompt: DemoPrompt } => Boolean(x.prompt));
  return { ...c, prompts: cps };
}

export function demoUpdateCollection(userId: string, collectionId: string, data: { name?: string; description?: string }) {
  const idx = state.collections.findIndex((x) => x.id === collectionId && x.userId === userId);
  if (idx === -1) return null;
  const c = state.collections[idx];
  const next: DemoCollection = {
    ...c,
    name: data.name ?? c.name,
    description: data.description ?? c.description,
    updatedAt: now(),
  };
  state.collections[idx] = next;
  return next;
}

export function demoDeleteCollection(userId: string, collectionId: string) {
  const idx = state.collections.findIndex((x) => x.id === collectionId && x.userId === userId);
  if (idx === -1) return false;
  state.collections.splice(idx, 1);
  state.collectionPrompts = state.collectionPrompts.filter((cp) => cp.collectionId !== collectionId);
  return true;
}

export function demoAddPromptToCollection(userId: string, collectionId: string, promptId: string) {
  const c = state.collections.find((x) => x.id === collectionId && x.userId === userId);
  if (!c) return null;
  const p = demoGetPrompt(promptId);
  if (!p || p.userId !== userId) return null;
  const existing = state.collectionPrompts.find((cp) => cp.collectionId === collectionId && cp.promptId === promptId);
  if (existing) return existing;
  const cp: DemoCollectionPrompt = { collectionId, promptId, addedAt: now() };
  state.collectionPrompts.unshift(cp);
  const idx = state.collections.findIndex((x) => x.id === collectionId);
  if (idx !== -1) state.collections[idx] = { ...state.collections[idx], updatedAt: now() };
  return cp;
}

export function demoRemovePromptFromCollection(userId: string, collectionId: string, promptId: string) {
  const c = state.collections.find((x) => x.id === collectionId && x.userId === userId);
  if (!c) return false;
  const before = state.collectionPrompts.length;
  state.collectionPrompts = state.collectionPrompts.filter((cp) => !(cp.collectionId === collectionId && cp.promptId === promptId));
  const changed = state.collectionPrompts.length !== before;
  if (changed) {
    const idx = state.collections.findIndex((x) => x.id === collectionId);
    if (idx !== -1) state.collections[idx] = { ...state.collections[idx], updatedAt: now() };
  }
  return changed;
}

function voteScoreForPrompt(promptId: string) {
  const votes = state.votes.filter((v) => v.promptId === promptId);
  const up = votes.filter((v) => v.type === "UP").length;
  const down = votes.filter((v) => v.type === "DOWN").length;
  return { up, down, score: up - down };
}

export function demoListStorePrompts(opts: { userId: string | null; sort: "votes" | "recent" | "uses"; search: string; page: number; pageSize: number }) {
  const filtered = state.prompts
    .filter((p) => !p.isPrivate)
    .filter((p) => {
      if (!opts.search) return true;
      const s = opts.search.toLowerCase();
      return (
        p.title.toLowerCase().includes(s) ||
        p.content.toLowerCase().includes(s)
      );
    });

  const sorted = filtered.sort((a, b) => {
    if (opts.sort === "recent") return b.createdAt.getTime() - a.createdAt.getTime();
    if (opts.sort === "uses") return b.useCount - a.useCount;
    const av = voteScoreForPrompt(a.id).score;
    const bv = voteScoreForPrompt(b.id).score;
    if (bv !== av) return bv - av;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const page = Math.max(1, opts.page);
  const items = sorted.slice((page - 1) * opts.pageSize, page * opts.pageSize).map((p) => {
    const score = voteScoreForPrompt(p.id);
    const userVote = opts.userId
      ? state.votes.find((v) => v.userId === opts.userId && v.promptId === p.id)?.type ?? null
      : null;
    const user = demoGetUser(p.userId);
    return {
      ...p,
      user: user ? { id: user.id, name: user.name, image: user.image } : { id: p.userId, name: "Unknown", image: null },
      _count: { votes: state.votes.filter((v) => v.promptId === p.id).length },
      voteScore: score.score,
      upVotes: score.up,
      downVotes: score.down,
      userVote,
    };
  });

  return { prompts: items, page, pageSize: opts.pageSize };
}

export function demoGetStorePrompt(opts: { userId: string | null; promptId: string }) {
  const p = demoGetPrompt(opts.promptId);
  if (!p || p.isPrivate) return null;
  const score = voteScoreForPrompt(p.id);
  const userVote = opts.userId
    ? state.votes.find((v) => v.userId === opts.userId && v.promptId === p.id)?.type ?? null
    : null;
  const user = demoGetUser(p.userId);
  return {
    prompt: {
      ...p,
      user: user ? { id: user.id, name: user.name, image: user.image } : { id: p.userId, name: "Unknown", image: null },
    },
    voteScore: score.score,
    userVote,
  };
}

export function demoVote(userId: string, promptId: string, type: VoteType) {
  const p = demoGetPrompt(promptId);
  if (!p || p.isPrivate) return null;

  const existingIdx = state.votes.findIndex((v) => v.userId === userId && v.promptId === promptId);
  if (existingIdx !== -1 && state.votes[existingIdx].type === type) {
    state.votes.splice(existingIdx, 1);
  } else if (existingIdx !== -1) {
    state.votes[existingIdx] = { ...state.votes[existingIdx], type };
  } else {
    state.votes.unshift({ id: id("v"), userId, promptId, type, createdAt: now() });
  }
  return voteScoreForPrompt(promptId);
}

export function demoClearVote(userId: string, promptId: string) {
  const before = state.votes.length;
  state.votes = state.votes.filter((v) => !(v.userId === userId && v.promptId === promptId));
  return state.votes.length !== before;
}

export function demoImportPrompt(userId: string, storePromptId: string) {
  const p = demoGetPrompt(storePromptId);
  if (!p || p.isPrivate) return null;
  const imported = demoCreatePrompt(userId, {
    title: p.title,
    content: p.content,
    keywords: p.keywords,
    keys: [],
    isPrivate: false,
    useCount: 0,
  });
  imported.importedFromId = p.id;
  return imported;
}
