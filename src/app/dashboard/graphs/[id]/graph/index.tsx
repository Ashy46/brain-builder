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

    const { data: nodesData, error: nodesError } = await supabase
      .from("graph_nodes")
      .select("*")
      .eq("graph_id", graphId);

    if (nodesError) {
      console.error(nodesError);
      toast.error("Failed to fetch nodes");
      return;
    }

    console.log("Fetched nodes:", nodesData);

    // Fetch conditional nodes and their connections
    const { data: conditionalNodes, error: conditionalError } = await supabase
      .from("graph_conditional_nodes")
      .select("*")
      .in(
        "graph_node_id",
        nodesData.map((node) => node.id)
      );

    if (conditionalError) {
      console.error(conditionalError);
      toast.error("Failed to fetch conditional nodes");
      return;
    }

    console.log("Fetched conditional nodes:", conditionalNodes);

    const curNodes: Node[] = [
      {
        id: "1",
        type: "analysis",
        data: { label: "Start" },
        position: { x: 0, y: 0 },
        draggable: false,
      },
      ...nodesData.map((node) => ({
        id: node.id,
        type: node.node_type.toLowerCase(),
        data: { id: node.id },
        position: { x: node.pos_x, y: node.pos_y },
      })),
    ];

    setNodes(curNodes);

    const edges: Edge[] = [];

    if (curNodes.length > 0 && graph) {
      for (const node of curNodes) {
        if (node.type === "analysis") {
          if (graph.child_node_id) {
            edges.push({
              id: `1-${graph.child_node_id}`,
              source: "1",
              target: graph.child_node_id,
            });
          }
        } else if (node.type === "conditional") {
          const conditionalNode = conditionalNodes.find(
            (cn) => cn.graph_node_id === node.id
          );
          console.log(
            "Found conditional node:",
            conditionalNode,
            "for node:",
            node
          );
          if (conditionalNode) {
            if (conditionalNode.true_child_id) {
              edges.push({
                id: `${node.id}-true-${conditionalNode.true_child_id}`,
                source: node.id,
                target: conditionalNode.true_child_id,
                sourceHandle: "true",
              });
            }
            if (conditionalNode.false_child_id) {
              edges.push({
                id: `${node.id}-false-${conditionalNode.false_child_id}`,
                source: node.id,
                target: conditionalNode.false_child_id,
                sourceHandle: "false",
              });
            }
          }
        }
      }
    }

    console.log("Created edges:", edges);
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
      console.log("Source handle:", connection.sourceHandle);

      // Make sure we have a valid sourceHandle for conditional nodes
      if (connection.source !== "1" && !connection.sourceHandle) {
        console.error("Missing sourceHandle for connection", connection);
        toast.error("Invalid connection: missing source handle");
        return;
      }

      const newEdge = addEdge(connection, edges);
      setEdges(newEdge);

      const supabase = createClient();

      if (connection.source === "1") {
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
      } else {
        // Handle conditional node connections
        const sourceNode = nodes.find((node) => node.id === connection.source);
        if (sourceNode?.type === "conditional") {
          console.log("Updating conditional connection:", connection);
          console.log(
            "Field to update:",
            connection.sourceHandle === "true"
              ? "true_child_id"
              : "false_child_id"
          );

          const { error } = await supabase
            .from("graph_conditional_nodes")
            .update({
              [connection.sourceHandle === "true"
                ? "true_child_id"
                : "false_child_id"]: connection.target,
            })
            .eq("graph_node_id", connection.source);

          if (error) {
            console.error(error);
            toast.error("Failed to update conditional connection");
            return;
          }

          toast.success("Conditional connection updated");
        }
      }

      // Refresh the graph to ensure all connections are properly loaded
      setRefresh(true);
    },
    [setEdges, edges, graphId, nodes, setRefresh]
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
