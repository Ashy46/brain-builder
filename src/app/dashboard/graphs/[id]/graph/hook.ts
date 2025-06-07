import { useState, useEffect } from "react";

import { Node, Edge } from "@xyflow/react";

import { useGraph } from "../context/graph-context";
import { fetchNodesAndEdges } from "./database";

export function useGraphData() {
  const { graphId, graph, refresh, setRefresh } = useGraph();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const removeEdges = (nodeId: string) => {
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  };

  useEffect(() => {
    if (refresh) {
      fetchNodesAndEdges(graphId).then(
        ({ nodes: fetchedNodes, edges: fetchedEdges }) => {
          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
        }
      );
      setRefresh(false);
    }
  }, [refresh, setRefresh, graphId]);

  useEffect(() => {
    if (isInitialLoad && graph) {
      fetchNodesAndEdges(graphId).then(
        ({ nodes: fetchedNodes, edges: fetchedEdges }) => {
          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
        }
      );
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, graph, graphId]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    graphId,
    setRefresh,
    removeEdges,
  };
}
