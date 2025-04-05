import { forwardRef, useState } from "react";

import { Edge } from "@xyflow/react";

import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

export interface GraphRef {
  fitView: () => void;
  addNode: () => void;
  selectedNode: Tables<"graph_nodes"> | null;
}

export const Graph = forwardRef<
  GraphRef,
  { graphId: string; onUpdateStart: () => void; onUpdateEnd: () => void }
>(({ graphId, onUpdateStart, onUpdateEnd }, ref) => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Tables<"graph_nodes">[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const;

  return <div>Graph {graphId}</div>;
});
