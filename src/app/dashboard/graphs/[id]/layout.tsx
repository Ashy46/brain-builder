"use client";

import { useParams } from "next/navigation";

import { createContext, useContext } from "react";

const GraphContext = createContext<{
  graphId: string;
}>({
  graphId: "",
});

export function useGraph() {
  const context = useContext(GraphContext);

  if (context === undefined) {
    throw new Error("useGraph must be used within a GraphProvider");
  }

  return context;
}

function GraphProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams();

  return (
    <GraphContext.Provider value={{ graphId: id as string }}>
      {children}
    </GraphContext.Provider>
  );
}

export default function GraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GraphProvider>{children}</GraphProvider>;
}
