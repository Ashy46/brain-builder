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
  const { graphId, graph, refresh, setRefresh } = useGraph();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchNodesAndMakeEdges = async () => {
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

    console.log("Setting nodes");

    const curNodes: Node[] = [
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
    ];

    setNodes(curNodes);

    console.log("Nodes:", curNodes);

    const edges: Edge[] = [];

    if (curNodes.length > 0 && graph) {
      for (const node of curNodes) {
        console.log("Node:", node);
        if (node.type === "analysis") {
          console.log("Graph:", graph);
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

    console.log("Edges:", edges);

    setEdges(edges);
  };

  useEffect(() => {
    if (refresh) {
      fetchNodesAndMakeEdges();
      setRefresh(false);
    }
  }, [refresh, setRefresh]);

  useEffect(() => {
    if (isInitialLoad) {
      if (!graph) return;

      fetchNodesAndMakeEdges();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, graph]);

  const debouncedUpdateNodePositionInDatabase = useCallback(
    debounce(updateNodePositionInDatabase, 300),
    []
  );

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

            for (const edge of edges) {
              if (edge.source === change.id) {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
              } else if (edge.target === change.id) {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
              }
            }
          }
        });

        return updatedNodes;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    async (changes: EdgeChange[]) => {
      console.log("Edge changes:", changes);
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        return updatedEdges;
      });
    },
    [setEdges]
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      console.log("New connection:", connection);

      const newEdge = addEdge(connection, edges);
      setEdges(newEdge);

      if (connection.source === "1") {
        const supabase = createClient();

        console.log(connection.target);

        const { error } = await supabase
          .from("graphs")
          .update({ child_node_id: connection.target })
          .eq("id", graphId);

        if (error) {
          console.error(error);
          toast.error("Failed to update graph connection");
          return;
        }

        toast.success("Graph connection updated");
      }
    },
    [setEdges, edges, graphId]
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        key={nodes.length}
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
