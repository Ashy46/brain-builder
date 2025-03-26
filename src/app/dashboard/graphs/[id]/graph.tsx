"use client";

import {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";

import {
  ReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  ReactFlowInstance,
  XYPosition,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { cn } from "@/lib/utils";
import {
  nodeTypes,
  NodeType,
  CustomNodeData,
  AnalysisNodeData,
  ConditionalNodeData,
  PromptNodeData,
} from "./nodes";
import { Controls } from "./controls";
import { AddNodeDialog } from "./add-node-dialog";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

export interface GraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  data: {
    type: NodeType;
    prompt?: string;
    childId?: string;
    trueChildId?: string;
    falseChildId?: string;
  };
}

const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 200;

export interface GraphRef {
  fitView: () => void;
  addNode: () => void;
  selectedNode: Node | null;
}

interface GraphProps {
  graphId: string;
  className?: string;
  onUpdateStart?: () => void;
  onUpdateEnd?: () => void;
}

interface FlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: any, node: Node) => void;
  onInit: (instance: ReactFlowInstance) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  handleAddNode: (type: NodeType, label: string) => void;
  isAddNodeDialogOpen: boolean;
  setIsAddNodeDialogOpen: (open: boolean) => void;
  isRootNode: boolean;
}

function Flow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onInit,
  selectedNode,
  setSelectedNode,
  handleAddNode,
  isAddNodeDialogOpen,
  setIsAddNodeDialogOpen,
  isRootNode,
}: FlowProps) {
  const { getViewport } = useReactFlow();

  // Handle keyboard events for node deletion
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (selectedNode && (event.key === 'Delete' || event.key === 'Backspace')) {
        const changes = [{ id: selectedNode.id, type: 'remove' as const }];
        onNodesChange(changes);
      }
    },
    [selectedNode, onNodesChange]
  );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onKeyDown={onKeyDown}
      >
        <Background />
        <Controls />
      </ReactFlow>
      <AddNodeDialog
        open={isAddNodeDialogOpen}
        onOpenChange={setIsAddNodeDialogOpen}
        onAddNode={handleAddNode}
        isRootNode={isRootNode}
        hasAnalysisNode={nodes.some((node) => node.type === "analysis")}
      />
    </>
  );
}

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const { user } = useAuth();
    const supabase = createClient();
    const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);

    // Helper function to update node data
    const updateNodeData = useCallback(
      async (nodeId: string, newData: any) => {
        // Update nodes state first (eager update)
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
          )
        );
        
        // Then update the database
        // First, retrieve the current node data
        const { data: currentNode, error: fetchError } = await supabase
          .from("nodes")
          .select("data")
          .eq("id", nodeId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching current node data:", fetchError);
          return false;
        }
        
        // Merge the existing data with the new data
        const mergedData = { ...currentNode.data, ...newData };
        
        // Update with the merged data
        const { error } = await supabase
          .from("nodes")
          .update({ data: mergedData })
          .eq("id", nodeId);

        if (error) {
          console.error("Error updating node data:", error);
          return false;
        }

        return true;
      },
      [supabase]
    );

    // Helper function to create an edge
    const createEdge = useCallback(
      async (sourceId: string, targetId: string, sourceHandle?: string) => {
        try {
          // Create the edge in the database - let Supabase generate the UUID
          const { data: newEdge, error } = await supabase
            .from("edges")
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

          // Create the new edge object
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

    // Helper function to delete an edge
    const deleteEdge = useCallback(
      async (edgeId: string) => {
        const { error } = await supabase.from("edges").delete().eq("id", edgeId);

        if (error) {
          console.error(`Error deleting edge ${edgeId}:`, error);
          return false;
        }

        return true;
      },
      [supabase]
    );

    // Helper function to update node relationships when an edge is created or deleted
    const updateNodeRelationships = useCallback(
      async (sourceNode: Node, targetNode: Node, sourceHandle?: string, isRemove: boolean = false) => {
        if (!sourceNode || !targetNode) return;

        try {
          const nodeType = sourceNode.type as NodeType;

          if (nodeType === "analysis") {
            await updateNodeData(sourceNode.id, {
              childId: isRemove ? undefined : targetNode.id,
            });
          } else if (nodeType === "conditional") {
            if (sourceHandle === "true") {
              await updateNodeData(sourceNode.id, {
                trueChildId: isRemove ? undefined : targetNode.id,
              });
            } else if (sourceHandle === "false") {
              await updateNodeData(sourceNode.id, {
                falseChildId: isRemove ? undefined : targetNode.id,
              });
            }
          }
        } catch (error) {
          console.error("Error updating node relationships:", error);
        }
      },
      [updateNodeData]
    );

    useEffect(() => {
      async function fetchGraph() {
        if (!user || !graphId) return;
        setIsLoading(true);

        try {
          // First, fetch the graph metadata
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

          // Then fetch nodes for this graph
          const { data: nodesData, error: nodesError } = await supabase
            .from("nodes")
            .select("*")
            .eq("graph_id", graphId);

          if (nodesError) {
            console.error("Error fetching nodes:", nodesError);
            return;
          }

          // Fetch edges
          const { data: edgesData, error: edgesError } = await supabase
            .from("edges")
            .select("*")
            .in(
              "source_node_id",
              nodesData.map((node) => node.id)
            );

          if (edgesError) {
            console.error("Error fetching edges:", edgesError);
            return;
          }

          // Transform nodes into React Flow format
          const flowNodes: Node[] = nodesData.map((node) => {
            const nodeData = node.data || {};
            const nodeType = nodeData.type || "prompt"; // Default to prompt if not specified

            const baseNodeData = {
              label: node.label,
              type: nodeType,
            };

            // Add type-specific properties and callbacks
            let fullNodeData: any = { ...baseNodeData };

            if (nodeType === "prompt") {
              fullNodeData = {
                ...baseNodeData,
                prompt: nodeData.prompt || "",
                onPromptChange: async (nodeId: string, newData: PromptNodeData) => {
                  await updateNodeData(nodeId, { prompt: newData.prompt });
                },
              };
            } else if (nodeType === "analysis") {
              fullNodeData = {
                ...baseNodeData,
                childId: nodeData.childId,
              };
            } else if (nodeType === "conditional") {
              fullNodeData = {
                ...baseNodeData,
                trueChildId: nodeData.trueChildId,
                falseChildId: nodeData.falseChildId,
              };
            }

            return {
              id: node.id,
              position: { x: node.position_x, y: node.position_y },
              type: nodeType,
              data: fullNodeData,
            };
          });

          // Transform edges into React Flow format
          const flowEdges: Edge[] = edgesData.map((edge) => {
            const sourceNode = nodesData.find(n => n.id === edge.source_node_id);
            let sourceHandle: string | undefined = undefined;
            
            if (sourceNode?.data?.type === "conditional") {
              // Handle potential null/undefined values with safe type checking
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

          // Set state
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
      async (newNodes: Node[], newEdges: Edge[]) => {
        onUpdateStart?.();
        try {
          // Update node positions
          for (const node of newNodes) {
            const { error } = await supabase
              .from("nodes")
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
      [supabase, onUpdateStart, onUpdateEnd]
    );

    // Debounced version of updateGraphData
    const debouncedUpdatePositions = useCallback(
      (newNodes: Node[], newEdges: Edge[]) => {
        // Clear any existing timeout
        if (positionUpdateTimeoutRef.current) {
          clearTimeout(positionUpdateTimeoutRef.current);
        }
        
        // Set a new timeout
        positionUpdateTimeoutRef.current = setTimeout(() => {
          updateGraphData(newNodes, newEdges);
          positionUpdateTimeoutRef.current = null;
        }, 500); // 500ms debounce time
      },
      [updateGraphData]
    );

    const onEdgesChangeCallback = useCallback(
      async (changes: any) => {
        // Apply the changes to local state
        const newEdges = applyEdgeChanges(changes, edges);
        setEdges(newEdges);

        // Handle edge deletions
        const removedEdges = changes.filter(
          (change: any) => change.type === "remove"
        );

        for (const change of removedEdges) {
          const edgeId = change.id;
          const edge = edges.find((e) => e.id === edgeId);
          
          if (edge) {
            // Delete edge from the database
            await deleteEdge(edgeId);
            
            // Update node relationships
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              await updateNodeRelationships(
                sourceNode, 
                targetNode, 
                edge.sourceHandle || undefined, 
                true // isRemove = true
              );
            }
          }
        }
      },
      [edges, nodes, deleteEdge, updateNodeRelationships]
    );

    // Function to safely delete a node and all its connections
    const deleteNode = useCallback(
      async (nodeId: string) => {
        try {
          // Update local state first (eager update)
          setEdges(
            edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            )
          );
          setNodes(nodes.filter((node) => node.id !== nodeId));

          // Clear selected node if it was the one deleted
          if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
          }

          // Find all edges connected to this node
          const connectedEdges = edges.filter(
            (edge) => edge.source === nodeId || edge.target === nodeId
          );

          // Delete all connected edges
          for (const edge of connectedEdges) {
            await deleteEdge(edge.id);
            
            // If this node is the target of an edge, update the source node's references
            if (edge.target === nodeId) {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const dummyTargetNode = { id: nodeId } as Node; // Just need the ID for the updateNodeRelationships function
              
              if (sourceNode) {
                await updateNodeRelationships(
                  sourceNode, 
                  dummyTargetNode, 
                  edge.sourceHandle || undefined, 
                  true // isRemove = true
                );
              }
            }
          }

          // Now delete the node itself
          const { error } = await supabase
            .from("nodes")
            .delete()
            .eq("id", nodeId);

          if (error) {
            console.error(`Error deleting node ${nodeId}:`, error);
            return false;
          }

          return true;
        } catch (error) {
          console.error("Error in deleteNode:", error);
          return false;
        }
      },
      [edges, nodes, selectedNode, supabase, deleteEdge, updateNodeRelationships]
    );

    const onNodesChangeCallback = useCallback(
      async (changes: any) => {
        // Check for deletion changes and handle them properly
        const deletionChanges = changes.filter(
          (change: any) => change.type === "remove"
        );
        const otherChanges = changes.filter(
          (change: any) => change.type !== "remove"
        );

        // Handle deletion requests without confirmation
        for (const change of deletionChanges) {
          const nodeId = change.id;
          await deleteNode(nodeId);
        }

        // Apply the non-deletion changes
        const newNodes = applyNodeChanges(otherChanges, nodes);
        setNodes(newNodes);

        // Find position changes
        const positionChanges = otherChanges.filter(
          (change: any) => change.type === "position" && change.position
        );

        // Only update the database if there are position changes, and use debouncing
        if (positionChanges.length > 0) {
          debouncedUpdatePositions(newNodes, edges);
        }
      },
      [nodes, edges, deleteNode, debouncedUpdatePositions]
    );

    const onConnect = useCallback(
      async (params: any) => {
        const sourceNode = nodes.find((node) => node.id === params.source);
        const targetNode = nodes.find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) return;
        
        // Prompt nodes can't have outgoing connections
        if (sourceNode.type === "prompt") {
          return;
        }

        // For analysis nodes, only allow one outgoing connection
        if (sourceNode.type === "analysis") {
          // Remove any existing connections
          const existingEdges = edges.filter(
            (edge) => edge.source === sourceNode.id
          );

          // Delete existing edges
          for (const edge of existingEdges) {
            await deleteEdge(edge.id);
          }
        }
        
        // For conditional nodes, check if we already have connections for this handle
        if (sourceNode.type === "conditional" && params.sourceHandle) {
          const existingConnections = edges.filter(
            (edge) =>
              edge.source === params.source &&
              edge.sourceHandle === params.sourceHandle
          );

          // Delete any existing connections for this handle
          for (const edge of existingConnections) {
            await deleteEdge(edge.id);
          }
        }

        // Create the new edge
        const newEdgeObj = await createEdge(
          sourceNode.id, 
          targetNode.id, 
          params.sourceHandle
        );
        
        if (newEdgeObj) {
          // Update node relationships
          await updateNodeRelationships(sourceNode, targetNode, params.sourceHandle);
          
          // Update edges state
          setEdges((currentEdges) => {
            // Remove any edges that would be replaced by this new connection
            const filteredEdges = currentEdges.filter(edge => {
              if (sourceNode.type === "analysis") {
                return edge.source !== sourceNode.id;
              }
              if (sourceNode.type === "conditional" && params.sourceHandle) {
                return !(edge.source === sourceNode.id && 
                         edge.sourceHandle === params.sourceHandle);
              }
              return true;
            });
            
            return [...filteredEdges, newEdgeObj];
          });
        }
      },
      [nodes, edges, createEdge, deleteEdge, updateNodeRelationships]
    );

    const onNodeClick = useCallback((event: any, node: Node) => {
      event.stopPropagation();
      setSelectedNode(node);
    }, []);

    const handleAddNode = useCallback(
      async (type: NodeType, label: string) => {
        if (!graphId || !label || !type) {
          console.error("Missing required fields for node creation");
          return;
        }

        try {
          const center = {
            x: 500,
            y: 300,
          };

          // Create initial node data based on type
          let nodeData: any = { type };
          
          // Add type-specific properties
          if (type === "prompt") {
            nodeData.prompt = "";
          }

          // Create the node in the database
          const { data: createdNode, error: nodeError } = await supabase
            .from("nodes")
            .insert({
              graph_id: graphId,
              label,
              position_x: center.x,
              position_y: center.y,
              data: nodeData
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

          // Use the ID generated by the database
          const newNodeId = createdNode.id;

          // Create the node for React Flow
          const newNode: Node = {
            id: newNodeId,
            position: center,
            type,
            data: {
              label,
              type,
              ...(type === "prompt" && {
                prompt: "",
                onPromptChange: async (nodeId: string, newData: PromptNodeData) => {
                  await updateNodeData(nodeId, { prompt: newData.prompt });
                },
              }),
            },
          };

          // Update local state
          setNodes([...nodes, newNode]);

          // If a node is selected, create an edge connecting them
          if (selectedNode) {
            // Skip connection if source is a prompt node
            if (selectedNode.type === "prompt") {
              return;
            }
            
            let sourceHandle: string | undefined = undefined;
            
            // For conditional nodes, determine which output to connect
            if (selectedNode.type === "conditional") {
              const hasTrueConnection = edges.some(
                e => e.source === selectedNode.id && e.sourceHandle === "true"
              );
              
              if (!hasTrueConnection) {
                sourceHandle = "true";
              } else {
                const hasFalseConnection = edges.some(
                  e => e.source === selectedNode.id && e.sourceHandle === "false"
                );
                
                if (!hasFalseConnection) {
                  sourceHandle = "false";
                }
              }
            }
            
            // Create the edge
            const newEdge = await createEdge(selectedNode.id, newNodeId, sourceHandle);
            
            if (newEdge) {
              // Update the source node's relationships
              await updateNodeRelationships(selectedNode, newNode, sourceHandle);
              
              // Update local state
              setEdges(prev => [...prev, newEdge]);
            }
          }
        } catch (error) {
          console.error("Error in handleAddNode:", error);
        }
      },
      [nodes, edges, selectedNode, graphId, supabase, createEdge, updateNodeRelationships, updateNodeData]
    );

    useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance.current?.fitView();
      },
      addNode: () => {
        setIsAddNodeDialogOpen(true);
      },
      selectedNode,
    }));

    // Clean up the timeout when the component unmounts
    useEffect(() => {
      return () => {
        if (positionUpdateTimeoutRef.current) {
          clearTimeout(positionUpdateTimeoutRef.current);
        }
      };
    }, []);

    if (isLoading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      );
    }

    return (
      <div className={cn("h-screen w-screen", className)}>
        <ReactFlowProvider>
          <Flow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeCallback}
            onEdgesChange={onEdgesChangeCallback}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            handleAddNode={handleAddNode}
            isAddNodeDialogOpen={isAddNodeDialogOpen}
            setIsAddNodeDialogOpen={setIsAddNodeDialogOpen}
            isRootNode={nodes.length === 0}
          />
        </ReactFlowProvider>
      </div>
    );
  }
);

Graph.displayName = "Graph";
