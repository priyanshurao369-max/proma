"use client";

import { SessionProvider } from "next-auth/react";

import { GlobalShortcutExpander } from "@/components/GlobalShortcutExpander";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0} refetchWhenOffline={false}>
      <GlobalShortcutExpander />
      {children}
    </SessionProvider>
  );
}
