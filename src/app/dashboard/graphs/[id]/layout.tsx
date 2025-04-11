"use client";

import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";
import { useParams } from "next/navigation";

import { createContext, useContext, useEffect, useState } from "react";

const GraphContext = createContext<{
  graphId: string;
  graph: Tables<"graphs"> | undefined;
}>({
  graphId: "",
  graph: undefined,
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
  const [graph, setGraph] = useState<Tables<"graphs"> | undefined>(undefined);

  useEffect(() => {
    const fetchGraph = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("graphs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching graph:", error);
        return;
      }

      if (!data) {
        console.error("Graph not found");
        return;
      }

      setGraph(data);
    };
  }, [id]);

  return (
    <GraphContext.Provider value={{ graphId: id as string, graph }}>
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
  setRefresh: () => {},
});

export function useRefreshGraph() {
  const context = useContext(RefreshGraphContext);

  if (context === undefined) {
    throw new Error(
      "useRefreshGraph must be used within a RefreshGraphProvider"
    );
  }

  return context;
}

function RefreshGraphProvider({ children }: { children: React.ReactNode }) {
  const [refresh, setRefresh] = useState(false);

  return (
    <RefreshGraphContext.Provider value={{ refresh, setRefresh }}>
      {children}
    </RefreshGraphContext.Provider>
  );
}

export function RefreshGraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RefreshGraphProvider>{children}</RefreshGraphProvider>;
}
