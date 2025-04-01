import { useState, useEffect, useCallback, useRef } from "react";
import { Node, Edge } from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { NodeType } from "./nodes";
import { GraphData } from "./types";

export const useGraphData = (graphId: string) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);

  const updateNodeData = useCallback(
    async (nodeId: string, newData: any) => {
      setNodes((currentNodes: Node[]) =>
        currentNodes.map((node: Node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );

      const { data: currentNode, error: fetchError } = await supabase
        .from("graph_nodes")
        .select("data, label")
        .eq("id", nodeId)
        .single();

      if (fetchError) {
        console.error("Error fetching current node data:", fetchError);
        return false;
      }

      const mergedData = { ...currentNode.data, ...newData };

      const { error } = await supabase
        .from("graph_nodes")
        .update({
          data: mergedData,
          ...(newData.label && { label: newData.label }),
        })
        .eq("id", nodeId);

      if (error) {
        console.error("Error updating node data:", error);
        return false;
      }

      return true;
    },
    [supabase]
  );

  useEffect(() => {
    async function fetchGraph() {
      if (!user || !graphId) return;
      setIsLoading(true);

      try {
        const { data: graphData, error: graphError } = await supabase
          .from("graphs")
          .select("*")
          .eq("id", graphId)
          .eq("user_id", user.id)
          .single();

        if (graphError) {
          console.error("Error fetching graph:", graphError);
          return;
        }

        if (!graphData) {
          console.error("No graph data found");
          return;
        }

        const { data: nodesData, error: nodesError } = await supabase
          .from("graph_nodes")
          .select("*")
          .eq("graph_id", graphId);

        if (nodesError) {
          console.error("Error fetching nodes:", nodesError);
          return;
        }

        const { data: edgesData, error: edgesError } = await supabase
          .from("graph_node_edges")
          .select("*")
          .in(
            "source_node_id",
            nodesData.map((node) => node.id)
          );

        if (edgesError) {
          console.error("Error fetching edges:", edgesError);
          return;
        }

        const flowNodes: Node[] = nodesData.map((node) => {
          const nodeData = node.data || {};
          const nodeType = nodeData.type || "prompt";

          const baseNodeData = {
            label: node.label,
            type: nodeType,
            onLabelChange: async (nodeId: string, newLabel: string) => {
              await updateNodeData(nodeId, { label: newLabel });
            },
          };

          let fullNodeData: any = { ...baseNodeData };

          if (nodeType === "prompt") {
            fullNodeData = {
              ...baseNodeData,
              prompt: nodeData.prompt || "",
              llmConfig: nodeData.llmConfig || {
                model: "gpt-4o-mini",
                temperature: 1.05,
                maxTokens: 256,
                frequencyPenalty: 0.4,
                presencePenalty: 0.4,
                topP: 1,
              },
              graphId,
              onPromptChange: async (nodeId: string, newData: any) => {
                await updateNodeData(nodeId, {
                  prompt: newData.prompt,
                  llmConfig: newData.llmConfig,
                });
              },
            };
          } else if (nodeType === "analysis") {
            fullNodeData = {
              ...baseNodeData,
              childId: nodeData.childId,
              selectedStates: nodeData.selectedStates || [],
              prompt: nodeData.prompt || "",
              graphId,
              onStatesChange: async (nodeId: string, stateIds: string[]) => {
                await updateNodeData(nodeId, { selectedStates: stateIds });
              },
              onPromptChange: async (nodeId: string, newData: any) => {
                await updateNodeData(nodeId, { prompt: newData.prompt });
              },
            };
          } else if (nodeType === "conditional") {
            fullNodeData = {
              ...baseNodeData,
              trueChildId: nodeData.trueChildId,
              falseChildId: nodeData.falseChildId,
              conditions: nodeData.conditions || [],
              operator: nodeData.operator || "and",
              graphId,
              onConditionalChange: async (nodeId: string, newData: any) => {
                await updateNodeData(nodeId, {
                  conditions: newData.conditions,
                  operator: newData.operator,
                });
              },
            };
          }

          return {
            id: node.id,
            position: { x: node.position_x, y: node.position_y },
            type: nodeType,
            data: fullNodeData,
          };
        });

        const flowEdges: Edge[] = edgesData.map((edge) => {
          const sourceNode = nodesData.find(
            (n) => n.id === edge.source_node_id
          );
          let sourceHandle: string | undefined = undefined;

          if (sourceNode?.data?.type === "conditional") {
            const trueChildId = sourceNode.data?.trueChildId;
            const falseChildId = sourceNode.data?.falseChildId;

            if (trueChildId && trueChildId === edge.target_node_id) {
              sourceHandle = "true";
            } else if (falseChildId && falseChildId === edge.target_node_id) {
              sourceHandle = "false";
            }
          }

          return {
            id: edge.id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            ...(sourceHandle && { sourceHandle }),
          };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in fetchGraph:", error);
        setIsLoading(false);
      }
    }

    fetchGraph();
  }, [user, graphId, supabase, updateNodeData]);

  const updateGraphData = useCallback(
    async (newNodes: Node[], newEdges: Edge[], onUpdateStart?: () => void, onUpdateEnd?: () => void) => {
      onUpdateStart?.();
      try {
        for (const node of newNodes) {
          const { error } = await supabase
            .from("graph_nodes")
            .update({
              position_x: node.position.x,
              position_y: node.position.y,
            })
            .eq("id", node.id);

          if (error) {
            console.error("Error updating node position:", error);
          }
        }

        return true;
      } catch (error) {
        console.error("Error in updateGraphData:", error);
        return false;
      } finally {
        onUpdateEnd?.();
      }
    },
    [supabase]
  );

  return {
    nodes,
    edges,
    selectedNode,
    isLoading,
    isAddNodeDialogOpen,
    setNodes,
    setEdges,
    setSelectedNode,
    setIsAddNodeDialogOpen,
    updateNodeData,
    updateGraphData,
  };
};

export const useGraphOperations = (
  graphId: string,
  updateNodeData: (nodeId: string, newData: any) => Promise<boolean>,
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  setSelectedNode: (node: Node | null) => void
) => {
  const supabase = createClient();

  const createEdge = useCallback(
    async (sourceId: string, targetId: string, sourceHandle?: string) => {
      try {
        const { data: newEdge, error } = await supabase
          .from("graph_node_edges")
          .insert({
            source_node_id: sourceId,
            target_node_id: targetId,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating edge:", error);
          return null;
        }

        const newEdgeObj: Edge = {
          id: newEdge.id,
          source: sourceId,
          target: targetId,
          ...(sourceHandle && { sourceHandle }),
        };

        return newEdgeObj;
      } catch (error) {
        console.error("Error in createEdge:", error);
        return null;
      }
    },
    [supabase]
  );

  const deleteEdge = useCallback(
    async (edgeId: string) => {
      const { error } = await supabase
        .from("graph_node_edges")
        .delete()
        .eq("id", edgeId);

      if (error) {
        console.error(`Error deleting edge ${edgeId}:`, error);
        return false;
      }

      return true;
    },
    [supabase]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      try {
        const { error } = await supabase
          .from("graph_nodes")
          .delete()
          .eq("id", nodeId);

        if (error) {
          console.error(`Error deleting node ${nodeId}:`, error);
          return false;
        }

        setEdges((currentEdges: Edge[]) =>
          currentEdges.filter(
            (edge: Edge) => edge.source !== nodeId && edge.target !== nodeId
          )
        );
        setNodes((currentNodes: Node[]) =>
          currentNodes.filter((node: Node) => node.id !== nodeId)
        );

        setSelectedNode(null);

        return true;
      } catch (error) {
        console.error("Error in deleteNode:", error);
        return false;
      }
    },
    [supabase, setEdges, setNodes, setSelectedNode]
  );

  const handleAddNode = useCallback(
    async (type: NodeType, label: string, selectedNode: Node | null, edges: Edge[]) => {
      if (!graphId || !label || !type) {
        console.error("Missing required fields for node creation");
        return;
      }

      try {
        const center = {
          x: 500,
          y: 300,
        };

        let nodeData: any = { type };

        if (type === "prompt") {
          nodeData = {
            ...nodeData,
            prompt: "",
            llmConfig: {
              model: "gpt-4o-mini",
              temperature: 1.05,
              maxTokens: 256,
              frequencyPenalty: 0.4,
              presencePenalty: 0.4,
              topP: 1,
            },
          };
        } else if (type === "analysis") {
          nodeData.selectedStates = [];
          nodeData.prompt = "";
        }

        const { data: createdNode, error: nodeError } = await supabase
          .from("graph_nodes")
          .insert({
            graph_id: graphId,
            label,
            position_x: center.x,
            position_y: center.y,
            data: nodeData,
          })
          .select()
          .single();

        if (nodeError) {
          console.error("Error creating node:", nodeError);
          return;
        }

        if (!createdNode) {
          console.error("No node was created");
          return;
        }

        const newNodeId = createdNode.id;

        const newNode: Node = {
          id: newNodeId,
          position: center,
          type,
          data: {
            label,
            type,
            ...(type === "prompt" && {
              prompt: "",
              onPromptChange: async (nodeId: string, newData: any) => {
                await updateNodeData(nodeId, { prompt: newData.prompt });
              },
            }),
            ...(type === "analysis" && {
              selectedStates: [],
              prompt: "",
              graphId,
              onStatesChange: async (nodeId: string, stateIds: string[]) => {
                await updateNodeData(nodeId, { selectedStates: stateIds });
              },
              onPromptChange: async (nodeId: string, newData: any) => {
                await updateNodeData(nodeId, { prompt: newData.prompt });
              },
            }),
          },
        };

        setNodes((prev: Node[]) => [...prev, newNode]);

        if (selectedNode) {
          if (selectedNode.type === "prompt") {
            return;
          }

          let sourceHandle: string | undefined = undefined;

          if (selectedNode.type === "conditional") {
            const hasTrueConnection = edges.some(
              (e) => e.source === selectedNode.id && e.sourceHandle === "true"
            );

            if (!hasTrueConnection) {
              sourceHandle = "true";
            } else {
              const hasFalseConnection = edges.some(
                (e) =>
                  e.source === selectedNode.id && e.sourceHandle === "false"
              );

              if (!hasFalseConnection) {
                sourceHandle = "false";
              }
            }
          }

          const newEdge = await createEdge(
            selectedNode.id,
            newNodeId,
            sourceHandle
          );

          if (newEdge) {
            setEdges((prev: Edge[]) => [...prev, newEdge]);
          }
        }
      } catch (error) {
        console.error("Error in handleAddNode:", error);
      }
    },
    [graphId, supabase, setNodes, setEdges, createEdge, updateNodeData]
  );

  return {
    createEdge,
    deleteEdge,
    deleteNode,
    handleAddNode,
  };
}; 