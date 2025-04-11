"use client";

import { useParams } from "next/navigation";

import { createContext, useContext, useState } from "react";

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

const RefreshGraphContext = createContext<{
  refresh: boolean;
  setRefresh: (refresh: boolean) => void;
}>({
  refresh: false,
  setRefresh: () => { },
});

export function useRefreshGraph() {
  const context = useContext(RefreshGraphContext);

  if (context === undefined) {
    throw new Error("useRefreshGraph must be used within a RefreshGraphProvider");
  }

  return context;
}

function RefreshGraphProvider({ children }: { children: React.ReactNode }) {
  const [refresh, setRefresh] = useState(false);

  return (
    <RefreshGraphContext.Provider value={{ refresh, setRefresh }}>
      {children}
    </RefreshGraphContext.Provider>
  )
}

export function RefreshGraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RefreshGraphProvider>{children}</RefreshGraphProvider>;
}