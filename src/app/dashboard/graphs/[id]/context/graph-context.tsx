"use client";

import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";
import { useParams } from "next/navigation";

import { createContext, useContext, useEffect, useState } from "react";

const GraphContext = createContext<{
  graphId: string;
  graph: Tables<"graphs"> | undefined;
  refresh: boolean;
  setRefresh: (refresh: boolean) => void;
}>({
  graphId: "",
  graph: undefined,
  refresh: false,
  setRefresh: () => { },
});

export function useGraph() {
  const context = useContext(GraphContext);

  if (context === undefined) {
    throw new Error("useGraph must be used within a GraphProvider");
  }

  return context;
}

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const [graph, setGraph] = useState<Tables<"graphs"> | undefined>(undefined);
  const [refresh, setRefresh] = useState(false);

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

    fetchGraph();
  }, [id]);

  return (
    <GraphContext.Provider value={{ graphId: id as string, graph, refresh, setRefresh }}>
      {children}
    </GraphContext.Provider>
  );
} 