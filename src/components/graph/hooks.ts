import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  NodeType,
  CustomNodeData,
  AnalysisNodeData,
  ConditionalNodeData,
  PromptNodeData,
} from "./nodes/types";
import { GraphData } from "./types";

export const useGraphData = (graphId: string) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  
  // Use a stable ID for the analysis node to prevent re-renders
  const analysisNodeId = useMemo(() => `analysis-${graphId}`, [graphId]);
  const isDataFetchedRef = useRef(false);

  // Update node data (for specific node types)
  const updateNodeData = useCallback(
    async (nodeId: string, newData: any) => {
      try {
        // First update the React state for immediate UI update
        setNodes((currentNodes: Node[]) =>
          currentNodes.map((node: Node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...newData } }
              : node
          )
        );

        // Skip API updates for the virtual analysis node
        if (nodeId.toString().startsWith('analysis-')) {
          return true;
        }

        // Get the node type to determine which table to update
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          console.error("Node not found for updating:", nodeId);
          return false;
        }

        const nodeType = node.type;

        // If we're updating a label, update the base node
        if (newData.label) {
          const { error: labelError } = await supabase
            .from("graph_nodes")
            .update({ label: newData.label })
            .eq("id", nodeId);

          if (labelError) {
            console.error("Error updating node label:", labelError);
            return false;
          }
        }

        // Special handling for the analysis node
        if (nodeType === "analysis") {
          // If updating selected states
          if (newData.selectedStates) {
            // No direct DB update as analysis node is special
            // In this refactored version, we keep this in memory only
            return true;
          }

          // If updating state prompts
          if (newData.statePrompts) {
            // Process each state prompt
            for (const statePrompt of newData.statePrompts) {
              const { error: stateError } = await supabase
                .from("graph_states")
                .update({
                  analysis_prompt: statePrompt.prompt,
                  analysis_config: statePrompt.llmConfig,
                })
                .eq("id", statePrompt.stateId);

              if (stateError) {
                console.error("Error updating state prompt:", stateError);
                return false;
              }
            }
            return true;
          }
        }
        // Handle conditional node updates
        else if (nodeType === "conditional") {
          // Update true/false child IDs
          if (
            newData.trueChildId !== undefined ||
            newData.falseChildId !== undefined
          ) {
            const updates: any = {};
            if (newData.trueChildId !== undefined) {
              updates.true_child_id = newData.trueChildId;
            }
            if (newData.falseChildId !== undefined) {
              updates.false_child_id = newData.falseChildId;
            }

            const { error: childError } = await supabase
              .from("graph_conditional_nodes")
              .update(updates)
              .eq("graph_node_id", nodeId);

            if (childError) {
              console.error(
                "Error updating conditional node child:",
                childError
              );
              return false;
            }
          }

          // Update conditions
          if (newData.conditions) {
            // First, delete existing conditions
            const { error: deleteError } = await supabase
              .from("graph_conditional_node_conditions")
              .delete()
              .eq("graph_conditional_node_id", nodeId);

            if (deleteError) {
              console.error("Error deleting conditions:", deleteError);
              return false;
            }

            // Then insert new conditions
            if (newData.conditions.length > 0) {
              const conditionsToInsert = newData.conditions.map(
                (condition: any) => ({
                  graph_conditional_node_id: nodeId,
                  state_id: condition.stateId,
                  conditional_operator: condition.operator.toUpperCase(),
                  value: condition.value,
                  created_at: new Date().toISOString(),
                })
              );

              const { error: insertError } = await supabase
                .from("graph_conditional_node_conditions")
                .insert(conditionsToInsert);

              if (insertError) {
                console.error("Error inserting conditions:", insertError);
                return false;
              }
            }
          }

          // Update operator
          if (newData.operator) {
            const { error: opError } = await supabase
              .from("graph_conditional_nodes")
              .update({ operator: newData.operator })
              .eq("graph_node_id", nodeId);

            if (opError) {
              console.error("Error updating conditional operator:", opError);
              return false;
            }
          }
        }
        // Handle prompt node updates
        else if (nodeType === "prompt") {
          // Update prompt content and settings
          if (newData.prompt !== undefined || newData.llmConfig) {
            // TODO: Add proper prompt table updates when we have that schema
            // For now, assuming we have a way to store these
            return true;
          }
        }

        return true;
      } catch (error) {
        console.error("Error in updateNodeData:", error);
        return false;
      }
    },
    [supabase, nodes]
  );

  useEffect(() => {
    async function fetchGraph() {
      if (!user || !graphId || isDataFetchedRef.current) return;
      console.log("🔄 Fetching graph data for graphId:", graphId);
      setIsLoading(true);

      try {
        // 1. Fetch the graph
        const { data: graphData, error: graphError } = await supabase
          .from("graphs")
          .select("*, child_node_id")
          .eq("id", graphId)
          .eq("user_id", user.id)
          .single();

        if (graphError) {
          console.error("Error fetching graph:", graphError);
          return;
        }

        // 2. Fetch base nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from("graph_nodes")
          .select("*")
          .eq("graph_id", graphId);

        if (nodesError) {
          console.error("Error fetching nodes:", nodesError);
          return;
        }

        // 3. Fetch conditional nodes
        const conditionalNodeIds = nodesData
          .filter((node) => node.node_type === "conditional")
          .map((node) => node.id);

        const { data: conditionalNodesData, error: condError } =
          conditionalNodeIds.length > 0
            ? await supabase
                .from("graph_conditional_nodes")
                .select("*, graph_conditional_node_conditions(*)")
                .in("graph_node_id", conditionalNodeIds)
            : { data: [], error: null };

        if (condError) {
          console.error("Error fetching conditional nodes:", condError);
          return;
        }

        // 4. Fetch prompt nodes
        const promptNodeIds = nodesData
          .filter((node) => node.node_type === "prompt")
          .map((node) => node.id);

        const { data: promptNodesData, error: promptError } =
          promptNodeIds.length > 0
            ? await supabase
                .from("graph_prompt_nodes")
                .select("*")
                .in("graph_node_id", promptNodeIds)
            : { data: [], error: null };

        if (promptError) {
          console.error("Error fetching prompt nodes:", promptError);
          return;
        }

        // 5. Fetch graph states (for analysis node)
        const { data: statesData, error: statesError } = await supabase
          .from("graph_states")
          .select("*")
          .eq("graph_id", graphId);

        if (statesError) {
          console.error("Error fetching states:", statesError);
          return;
        }

        // Create the virtual analysis node data
        const analysisNodeData: any = {
          label: "Analysis",
          type: "analysis",
          selectedStates: statesData.map((state) => state.id),
          statePrompts: statesData.map((state) => ({
            stateId: state.id,
            prompt: state.analysis_prompt || "",
            llmConfig: state.analysis_config || {
              model: "gpt-4o-mini" as const,
              temperature: 1.05,
              maxTokens: 256,
              frequencyPenalty: 0.4,
              presencePenalty: 0.4,
              topP: 1,
            },
          })),
          graphId,
          onStatesChange: useCallback(async (nodeId: string, stateIds: string[]) => {
            // This is a UI-only update for selected states
            setNodes((currentNodes) =>
              currentNodes.map((node) =>
                node.id === analysisNodeId // Use the stable ID
                  ? {
                      ...node,
                      data: { ...node.data, selectedStates: stateIds },
                    }
                  : node
              )
            );
          }, [analysisNodeId]),
          onStatePromptChange: useCallback(async (
            nodeId: string,
            stateId: string,
            prompt: string,
            llmConfig?: any
          ) => {
            try {
              // Update the graph_states table directly
              const { error } = await supabase
                .from("graph_states")
                .update({
                  analysis_prompt: prompt,
                  analysis_config: llmConfig || {
                    model: "gpt-4o-mini",
                    temperature: 1.05,
                    maxTokens: 256,
                    frequencyPenalty: 0.4,
                    presencePenalty: 0.4,
                    topP: 1,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq("id", stateId);

              if (error) {
                console.error("Error updating state prompt:", error);
                toast.error("Failed to update state prompt");
                return false;
              }

              // Update React state - use the stable ID
              setNodes((currentNodes) =>
                currentNodes.map((node) => {
                  if (node.id !== analysisNodeId) return node;

                  const updatedPrompts = Array.isArray(node.data?.statePrompts) 
                    ? [...node.data.statePrompts] 
                    : [];
                  const promptIndex = updatedPrompts.findIndex(
                    (p) => p.stateId === stateId
                  );

                  if (promptIndex >= 0) {
                    updatedPrompts[promptIndex] = {
                      stateId,
                      prompt,
                      llmConfig,
                    };
                  } else {
                    updatedPrompts.push({
                      stateId,
                      prompt,
                      llmConfig,
                    });
                  }

                  return {
                    ...node,
                    data: {
                      ...node.data,
                      statePrompts: updatedPrompts,
                    },
                  };
                })
              );

              toast.success("State prompt updated");
              return true;
            } catch (error) {
              console.error("Error in onStatePromptChange:", error);
              toast.error("Failed to update state prompt");
              return false;
            }
          }, [analysisNodeId, supabase]),
        };

        const analysisNode: Node = {
          id: analysisNodeId,
          type: "analysis",
          position: { x: 0, y: 0 },
          data: analysisNodeData,
          draggable: false,
        };

        // Build the flow nodes
        const flowNodes: Node[] = [
          analysisNode,
          ...await Promise.all(nodesData.map(async (node) => {
            const nodeType = node.node_type || "prompt";

            let nodeData: any = {
              label: node.label,
              type: nodeType,
              onLabelChange: async (nodeId: string, newLabel: string) => {
                await updateNodeData(nodeId, { label: newLabel });
              },
            };

            // Add type-specific data
            if (nodeType === "prompt") {
              const promptNode = promptNodesData?.find(
                (pn) => pn.graph_node_id === node.id
              );
              
              // Fetch the associated user_prompt data if a prompt_id exists
              let promptContent = "";
              let promptConfig = {
                model: "gpt-4o-mini" as const,
                temperature: 1.05,
                maxTokens: 256,
                frequencyPenalty: 0.4,
                presencePenalty: 0.4,
                topP: 1,
              };
              
              if (promptNode?.prompt_id) {
                try {
                  // Get the prompt content and settings from user_prompts
                  const { data: userPromptData, error: promptError } = await supabase
                    .from("user_prompts")
                    .select("*")
                    .eq("id", promptNode.prompt_id)
                    .single();
                    
                  if (!promptError && userPromptData) {
                    promptContent = userPromptData.content || "";
                    promptConfig = {
                      model: userPromptData.llm_model,
                      temperature: userPromptData.temperature,
                      maxTokens: userPromptData.max_tokens,
                      frequencyPenalty: userPromptData.frequency_penalty,
                      presencePenalty: userPromptData.presence_penalty,
                      topP: userPromptData.top_p,
                    };
                  } else {
                    console.warn(`Could not find user_prompt with ID ${promptNode.prompt_id}`, promptError);
                  }
                } catch (error) {
                  console.error("Error fetching user_prompt data:", error);
                }
              }

              nodeData = {
                ...nodeData,
                prompt: promptContent,
                promptId: promptNode?.prompt_id,
                llmConfig: promptConfig,
                graphId,
                onPromptChange: async (nodeId: string, newData: any) => {
                  try {
                    // Update the user_prompts entry instead of storing in the node directly
                    if (newData.promptId) {
                      const { error: updateError } = await supabase
                        .from("user_prompts")
                        .update({
                          content: newData.prompt || "",
                          temperature: newData.llmConfig?.temperature || 1.05,
                          frequency_penalty: newData.llmConfig?.frequencyPenalty || 0.4,
                          presence_penalty: newData.llmConfig?.presencePenalty || 0.4,
                          max_tokens: newData.llmConfig?.maxTokens || 256,
                          top_p: newData.llmConfig?.topP || 1,
                          llm_model: newData.llmConfig?.model || "gpt-4o-mini",
                        })
                        .eq("id", newData.promptId);

                      if (updateError) {
                        console.error("Error updating prompt:", updateError);
                        return false;
                      }
                    }
                    
                    // Update node UI state regardless
                    await updateNodeData(nodeId, {
                      prompt: newData.prompt,
                      llmConfig: newData.llmConfig,
                      promptId: newData.promptId, // Make sure to keep track of the promptId
                    });
                    
                    return true;
                  } catch (error) {
                    console.error("Error in onPromptChange:", error);
                    return false;
                  }
                },
              };
            } else if (nodeType === "conditional") {
              const condNode = conditionalNodesData?.find(
                (cn) => cn.graph_node_id === node.id
              );
              const conditions =
                condNode?.graph_conditional_node_conditions?.map(
                  (cond: any) => ({
                    stateId: cond.state_id,
                    operator: cond.conditional_operator.toLowerCase(),
                    value: cond.value || "",
                  })
                ) || [];

              nodeData = {
                ...nodeData,
                trueChildId: condNode?.true_child_id,
                falseChildId: condNode?.false_child_id,
                conditions,
                operator: condNode?.operator || "and",
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
              position: { x: node.pos_x, y: node.pos_y },
              type: nodeType,
              data: nodeData,
            };
          })),
        ];

        // Build edges from the node relationships (no edge table)
        const flowEdges: Edge[] = [];

        // Add edge from analysis node to first node if exists
        if (graphData.child_node_id) {
          flowEdges.push({
            id: `analysis-edge-${graphId}`,
            source: analysisNode.id,
            target: graphData.child_node_id,
          });
        }

        // Add edges from conditional nodes (true/false paths)
        for (const node of nodesData) {
          if (node.node_type === "conditional") {
            const condNode = conditionalNodesData?.find(
              (cn) => cn.graph_node_id === node.id
            );

            if (condNode?.true_child_id) {
              flowEdges.push({
                id: `edge-true-${node.id}`,
                source: node.id,
                target: condNode.true_child_id,
                sourceHandle: "true",
              });
            }

            if (condNode?.false_child_id) {
              flowEdges.push({
                id: `edge-false-${node.id}`,
                source: node.id,
                target: condNode.false_child_id,
                sourceHandle: "false",
              });
            }
          }
        }

        setNodes(flowNodes);
        setEdges(flowEdges);
        isDataFetchedRef.current = true;
        setIsLoading(false);
      } catch (error) {
        console.error("Error in fetchGraph:", error);
        setIsLoading(false);
      }
    }

    fetchGraph();
  }, [user, graphId, supabase, updateNodeData]);

  // Update graph data (positions)
  const updateGraphData = useCallback(
    async (
      newNodes: Node[],
      newEdges: Edge[],
      onUpdateStart?: () => void,
      onUpdateEnd?: () => void
    ) => {
      try {
        onUpdateStart?.();
        
        // Filter out the special analysis node
        const realNodes = newNodes.filter((node) => !node.id.toString().startsWith('analysis-'));

        for (const node of realNodes) {
          try {
            const { error } = await supabase
              .from("graph_nodes")
              .update({
                pos_x: node.position.x,
                pos_y: node.position.y,
              })
              .eq("id", node.id);

            if (error) {
              console.error("Error updating node position:", error);
            }
          } catch (updateError) {
            console.error(`Error updating position for node ${node.id}:`, updateError);
            // Continue with other nodes even if one fails
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
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  updateNodeData: (nodeId: string, data: any) => Promise<boolean>,
  createEdge: (
    sourceId: string,
    targetId: string,
    sourceHandle?: string
  ) => Promise<Edge | null>,
  selectedNode: Node | null,
  setSelectedNode: (node: Node | null) => void,
  setIsAddNodeDialogOpen: (open: boolean) => void,
  isRootNode: boolean
) => {
  const { user } = useAuth();
  const supabase = createClient();

  const deleteEdge = useCallback(
    async (edge: Edge) => {
      try {
        const { source: sourceId, target: targetId, sourceHandle } = edge;

        // Find the source node to determine what type of edge this is
        const sourceNode = nodes.find((node) => node.id === sourceId);

        if (!sourceNode) {
          console.error("Source node not found for edge deletion:", sourceId);
          return false;
        }

        // If it's an analysis node (graph root), update the graph
        if (sourceNode.type === "analysis") {
          const { error } = await supabase
            .from("graphs")
            .update({ child_node_id: null })
            .eq("id", graphId);

          if (error) {
            console.error("Error removing graph child node:", error);
            return false;
          }
        }
        // If it's a conditional node, clear the appropriate child reference
        else if (sourceNode.type === "conditional") {
          const fieldToUpdate =
            sourceHandle === "true" ? "true_child_id" : "false_child_id";

          const { error } = await supabase
            .from("graph_conditional_nodes")
            .update({ [fieldToUpdate]: null })
            .eq("graph_node_id", sourceId);

          if (error) {
            console.error(
              `Error clearing conditional node ${fieldToUpdate}:`,
              error
            );
            return false;
          }

          // Also update the node data in UI
          await updateNodeData(sourceId, {
            [sourceHandle === "true" ? "trueChildId" : "falseChildId"]: null,
          });
        }

        // Remove edge from UI state
        setEdges((currentEdges) =>
          currentEdges.filter((e) => e.id !== edge.id)
        );

        return true;
      } catch (error) {
        console.error("Error in deleteEdge:", error);
        return false;
      }
    },
    [supabase, graphId, nodes, updateNodeData]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      try {
        // Get node info first to determine its type
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          console.error(`Node ${nodeId} not found for deletion`);
          return false;
        }

        // Remove any edges connected to this node first
        const connectedEdges = edges.filter(
          (edge) => edge.source === nodeId || edge.target === nodeId
        );

        for (const edge of connectedEdges) {
          await deleteEdge(edge);
        }

        // If it's a conditional node, delete from specialized table first
        if (node.type === "conditional") {
          // Delete any conditions first
          const { error: conditionsError } = await supabase
            .from("graph_conditional_node_conditions")
            .delete()
            .eq("graph_conditional_node_id", nodeId);

          if (conditionsError) {
            console.error(
              "Error deleting conditional node conditions:",
              conditionsError
            );
          }

          // Delete the conditional node entry
          const { error: condNodeError } = await supabase
            .from("graph_conditional_nodes")
            .delete()
            .eq("graph_node_id", nodeId);

          if (condNodeError) {
            console.error("Error deleting conditional node:", condNodeError);
          }
        }
        // If it's a prompt node, delete from specialized table first
        else if (node.type === "prompt") {
          const { error: promptNodeError } = await supabase
            .from("graph_prompt_nodes")
            .delete()
            .eq("graph_node_id", nodeId);

          if (promptNodeError) {
            console.error("Error deleting prompt node:", promptNodeError);
          }
        }

        // Delete the base node
        const { error } = await supabase
          .from("graph_nodes")
          .delete()
          .eq("id", nodeId);

        if (error) {
          console.error(`Error deleting node ${nodeId}:`, error);
          return false;
        }

        // Update UI state
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
    [supabase, nodes, edges, deleteEdge, setNodes, setSelectedNode]
  );

  const handleAddNode = useCallback(
    async (
      type: NodeType,
      label: string,
      selectedNode: Node | null,
      edges: Edge[]
    ) => {
      if (!graphId || !label || !type) {
        console.error("Missing required fields for node creation:", { graphId, label, type });
        return;
      }

      // Log the node creation attempt with expected node_type value
      console.log("Creating node with params:", { 
        graphId, 
        label, 
        type, 
        node_type: type === "analysis" ? "PROMPT" : type.toUpperCase(),
        selectedNodeId: selectedNode?.id 
      });

      try {
        const center = {
          x: 500,
          y: 300,
        };

        // First create the base node
        const { data: createdNode, error: nodeError } = await supabase
          .from("graph_nodes")
          .insert({
            graph_id: graphId,
            label,
            pos_x: center.x,
            pos_y: center.y,
            node_type: type === "analysis" ? "PROMPT" : type.toUpperCase(), // Convert to uppercase to match the enum
          })
          .select()
          .single();

        if (nodeError) {
          console.error("Error creating node:", nodeError);
          throw new Error(`Failed to create node: ${nodeError.message || JSON.stringify(nodeError)}`);
        }

        if (!createdNode) {
          console.error("No node was created");
          throw new Error("No node was created by the database");
        }

        const newNodeId = createdNode.id;
        
        // Variable to store prompt ID if needed
        let promptId: string | null = null;

        // Create the specialized node entry based on type
        if (type === "conditional") {
          // Create conditional node entry
          const { error: condNodeError } = await supabase
            .from("graph_conditional_nodes")
            .insert({
              graph_node_id: newNodeId,
              created_at: new Date().toISOString(),
              operator: "and",
              true_child_id: null,
              false_child_id: null,
            });

          if (condNodeError) {
            console.error("Error creating conditional node:", condNodeError);
            // Rollback if there was an error
            await supabase.from("graph_nodes").delete().eq("id", newNodeId);
            throw new Error(`Failed to create conditional node: ${condNodeError.message}`);
          }
        } else if (type === "prompt") {
          // Check that user is defined
          if (!user) {
            console.error("User is not authenticated");
            await supabase.from("graph_nodes").delete().eq("id", newNodeId);
            throw new Error("User is not authenticated. Please sign in to create prompts.");
          }

          // First create a prompt in user_prompts
          const { data: createdPrompt, error: promptError } = await supabase
            .from("user_prompts")
            .insert({
              content: "",
              description: `Prompt for ${label}`,
              frequency_penalty: 0.4,
              llm_model: "gpt-4o-mini",
              max_tokens: 256,
              presence_penalty: 0.4,
              public: false,
              temperature: 1.05,
              top_p: 1,
              user_id: user.id,
            })
            .select()
            .single();

          if (promptError) {
            console.error("Error creating user prompt:", promptError);
            // Rollback if there was an error
            await supabase.from("graph_nodes").delete().eq("id", newNodeId);
            throw new Error(`Failed to create prompt: ${promptError.message}`);
          }
          
          // Save the promptId for later use in nodeData
          promptId = createdPrompt.id;

          // Now create the prompt node entry that references the user_prompt
          const { error: promptNodeError } = await supabase
            .from("graph_prompt_nodes")
            .insert({
              graph_node_id: newNodeId,
              created_at: new Date().toISOString(),
              prompt_id: promptId, // Reference the newly created prompt
            });

          if (promptNodeError) {
            console.error("Error creating prompt node:", promptNodeError);
            // Rollback both the node and the prompt
            await supabase.from("user_prompts").delete().eq("id", promptId);
            await supabase.from("graph_nodes").delete().eq("id", newNodeId);
            throw new Error(`Failed to link prompt node: ${promptNodeError.message}`);
          }
        }

        // Create UI node object
        let nodeData: any = {
          label,
          type,
          onLabelChange: async (nodeId: string, newLabel: string) => {
            await updateNodeData(nodeId, { label: newLabel });
          },
        };

        if (type === "prompt") {
          nodeData = {
            ...nodeData,
            prompt: "",
            promptId: promptId,  // Store the prompt ID for reference
            llmConfig: {
              model: "gpt-4o-mini",
              temperature: 1.05,
              maxTokens: 256,
              frequencyPenalty: 0.4,
              presencePenalty: 0.4,
              topP: 1,
            },
            graphId,
            onPromptChange: async (nodeId: string, newData: any) => {
              try {
                // Update the user_prompts entry instead of storing in the node directly
                if (newData.promptId) {
                  const { error: updateError } = await supabase
                    .from("user_prompts")
                    .update({
                      content: newData.prompt || "",
                      temperature: newData.llmConfig?.temperature || 1.05,
                      frequency_penalty: newData.llmConfig?.frequencyPenalty || 0.4,
                      presence_penalty: newData.llmConfig?.presencePenalty || 0.4,
                      max_tokens: newData.llmConfig?.maxTokens || 256,
                      top_p: newData.llmConfig?.topP || 1,
                      llm_model: newData.llmConfig?.model || "gpt-4o-mini",
                    })
                    .eq("id", newData.promptId);

                  if (updateError) {
                    console.error("Error updating prompt:", updateError);
                    return false;
                  }
                }
                
                // Update node UI state regardless
                await updateNodeData(nodeId, {
                  prompt: newData.prompt,
                  llmConfig: newData.llmConfig,
                  promptId: newData.promptId, // Make sure to keep track of the promptId
                });
                
                return true;
              } catch (error) {
                console.error("Error in onPromptChange:", error);
                return false;
              }
            },
          };
        } else if (type === "conditional") {
          nodeData = {
            ...nodeData,
            conditions: [],
            operator: "and",
            trueChildId: null,
            falseChildId: null,
            graphId,
            onConditionalChange: async (nodeId: string, newData: any) => {
              await updateNodeData(nodeId, {
                conditions: newData.conditions,
                operator: newData.operator,
              });
            },
          };
        }

        const newNode: Node = {
          id: newNodeId,
          position: center,
          type,
          data: nodeData,
        };

        setNodes((prev: Node[]) => [...prev, newNode]);

        // Connect the node if a node was selected
        if (selectedNode) {
          if (selectedNode.type === "prompt") {
            return; // Prompt nodes can't have children
          }

          let sourceHandle: string | undefined = undefined;

          // For conditional nodes, determine which handle to use
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

          // Create the edge
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
        // Show a notification to the user about the error
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('graph:error', {
              detail: {
                message: error instanceof Error ? error.message : 'Unknown error creating node',
                context: { type, label, graphId }
              }
            })
          );
        }
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

export const useStatePromptData = (graphId: string) => {
  const { user } = useAuth();
  const supabase = createClient();

  const updateStatePrompt = useCallback(
    async (stateId: string, prompt: string, llmConfig?: any) => {
      try {
        // Update database with the new schema fields
        const { error: dbError } = await supabase
          .from("graph_states")
          .update({
            analysis_prompt: prompt,
            analysis_config: llmConfig || {
              model: "gpt-4o-mini",
              temperature: 1.05,
              maxTokens: 256,
              frequencyPenalty: 0.4,
              presencePenalty: 0.4,
              topP: 1,
            },
            updated_at: new Date().toISOString()
          })
          .eq("id", stateId);

        if (dbError) {
          throw dbError;
        }

        return true;
      } catch (error) {
        console.error("Error updating state prompt:", error);
        toast.error("Failed to update state prompt", {
          description:
            "An unexpected error occurred. Check console for details.",
          duration: 4000,
        });
        return false;
      }
    },
    [supabase]
  );

  return {
    updateStatePrompt,
  };
};
