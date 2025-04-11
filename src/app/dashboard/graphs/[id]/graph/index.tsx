"use client";

import { useState, useCallback, useEffect } from "react";

import { debounce } from "lodash";
import {
  ReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Controls } from "./controls";
import { AnalysisNode } from "../nodes/analysis-node";
import { PromptNode } from "../nodes/prompt-node";
import { ConditionalNode } from "../nodes/conditional-node";
import { useGraph } from "../layout";
import { updateNodePositionInDatabase, deleteNodeFromDatabase } from "./utils";

const nodeTypes = {
  analysis: AnalysisNode,
  prompt: PromptNode,
  conditional: ConditionalNode,
};

export function Graph() {
  const { graphId, graph } = useGraph();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);

        changes.forEach((change) => {
          if (change.type === "position" && change.position) {
            const movedNode = updatedNodes.find(
              (node) => node.id === change.id
            );

            if (movedNode) {
              debouncedUpdateNodePositionInDatabase(
                movedNode.id,
                movedNode.position
              );
            }
          } else if (change.type === "remove") {
            if (change.id !== "1") {
              deleteNodeFromDatabase(change.id);
            }
          }
        });

        return updatedNodes;
      });
    },
    [setNodes]
  );

  const debouncedUpdateNodePositionInDatabase = useCallback(
    debounce(updateNodePositionInDatabase, 300),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  async function fetchNodes() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_nodes")
      .select("*")
      .eq("graph_id", graphId);

    if (error) {
      console.error(error);
      toast.error("Failed to fetch nodes");
      return;
    }

    setNodes([
      {
        id: "1",
        type: "analysis",
        data: { label: "Start" },
        position: { x: 0, y: 0 },
        draggable: false,
      },
      ...data.map((node) => ({
        id: node.id,
        type: node.node_type.toLowerCase(),
        data: { id: node.id },
        position: { x: node.pos_x, y: node.pos_y },
      })),
    ]);
  }

  useEffect(() => {
    fetchNodes();
  }, []);

  useEffect(() => {
    const edges: Edge[] = [];

    if (nodes.length > 0 && graph) {
      for (const node of nodes) {
        if (node.type === "analysis") {
          if (graph.child_node_id) {
            edges.push({
              id: `1-${graph.child_node_id}`,
              source: "1",
              target: graph.child_node_id,
            });
          }
        }
      }
    }
  }, [nodes, graph]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
