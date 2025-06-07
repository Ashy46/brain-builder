"use client";

import { GraphProvider } from "./context/graph-context";

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return (
    <GraphProvider>
      {children}
    </GraphProvider>
  );
}
