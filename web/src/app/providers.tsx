"use client";

import { GlobalShortcutExpander } from "@/components/GlobalShortcutExpander";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalShortcutExpander />
      {children}
    </>
  );
}
