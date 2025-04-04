import { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/tailwind";
import { useGraphData } from "./hooks";
import { useGraphOperations } from "./hooks";
import { GraphContent } from "./graph-content";
import { GraphProps, GraphRef } from "./types";
import { createClient } from "@/lib/supabase/client";

// Debug counter to track re-renders
let renderCount = 0;

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
    // Debug - count renders
    renderCount++;
    
    // Log render with count
    console.log(`🔄 Graph component rendering (#${renderCount}), graphId: ${graphId}`);
    
    const [error, setError] = useState<Error | null>(null);

    // Add error handler
    useEffect(() => {
      // Notify about initial render to help debugging
      toast.info(`Graph initialized (render #${renderCount})`);
      
      const handleError = (event: ErrorEvent) => {
        console.error("Global error caught:", event.error);
        setError(event.error);
        event.preventDefault(); // Prevent default error handling (reloading)
      };

      // Listen for custom graph:error events
      const handleGraphError = (event: CustomEvent) => {
        if (event.detail) {
          console.error("Graph operation error:", event.detail);
          toast.error(event.detail.message || "Graph operation failed", {
            description: JSON.stringify(event.detail.context || {}),
            duration: 5000
          });
        }
      };

      window.addEventListener("error", handleError);
      window.addEventListener("graph:error", handleGraphError as EventListener);
      
      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("graph:error", handleGraphError as EventListener);
      };
    }, []);

    // If there was an error, show error UI
    if (error) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            There was an error loading the graph
          </h2>
          <div className="bg-red-50 border border-red-200 p-4 rounded-md max-w-md">
            <p className="text-sm text-red-800 mb-2">Error: {error.message}</p>
            <button
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    try {
      const supabase = createClient();
      const {
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
      } = useGraphData(graphId);

      // Create edge function - now directly updates node relationships instead of using an edge table
      const createEdge = useCallback(async (sourceId: string, targetId: string, sourceHandle?: string) => {
        console.log('Creating edge with params:', { sourceId, targetId, sourceHandle, graphId });

        try {
          // Find the source node to determine edge type
          const sourceNode = nodes.find(node => node.id === sourceId);
          
          if (!sourceNode) {
            console.error('Source node not found:', sourceId);
            return null;
          }

          console.log('Source node type:', sourceNode.type);

          // For the analysis node, update the graph's child_node_id
          if (sourceNode.type === 'analysis' || sourceId.toString().startsWith('analysis-')) {
            try {
              const { error } = await supabase
                .from('graphs')
                .update({ child_node_id: targetId })
                .eq('id', graphId);

              if (error) {
                console.error('Error updating graph child node:', error);
                return null;
              }

              // Create a virtual edge object for the UI
              return {
                id: `analysis-edge-${graphId}-${Date.now()}`,
                source: sourceId,
                target: targetId
              };
            } catch (err) {
              console.error('Error in analysis node connection:', err);
              return null;
            }
          }
          
          // For conditional nodes, update the true/false child references
          if (sourceNode.type === 'conditional') {
            try {
              // Determine if this is the true or false path
              const fieldToUpdate = sourceHandle === 'true' ? 'true_child_id' : 'false_child_id';
              
              const { error } = await supabase
                .from('graph_conditional_nodes')
                .update({ [fieldToUpdate]: targetId })
                .eq('graph_node_id', sourceId);

              if (error) {
                console.error(`Error updating conditional node ${fieldToUpdate}:`, error);
                return null;
              }

              // Also update the node data for UI
              await updateNodeData(sourceId, {
                [sourceHandle === 'true' ? 'trueChildId' : 'falseChildId']: targetId
              });

              // Create a virtual edge object for the UI
              return {
                id: `edge-${sourceHandle}-${sourceId}-${Date.now()}`,
                source: sourceId,
                target: targetId,
                sourceHandle
              };
            } catch (err) {
              console.error('Error in conditional node connection:', err);
              return null;
            }
          }

          // For other node types, we're not supporting edges directly in this schema
          console.log('Unsupported source node type for edge creation:', sourceNode.type);
          return null;
        } catch (err) {
          console.error('Unexpected error creating edge:', err);
          return null;
        }
      }, [graphId, supabase, nodes, updateNodeData]);

      // Get graph operations
      const { deleteEdge, deleteNode, handleAddNode } = useGraphOperations(
        graphId,
        nodes,
        edges,
        setNodes,
        setEdges,
        async (nodeId: string, data: any) => {
          const result = await updateNodeData(nodeId, data);
          if (!result) {
            console.error("Failed to update node data");
          }
          return result;
        },
        createEdge,
        selectedNode,
        setSelectedNode,
        setIsAddNodeDialogOpen,
        nodes.length === 0
      );

      // Position update handling
      const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      const reactFlowInstance = useRef<any | null>(null);

      const debouncedUpdatePositions = useCallback(
        (newNodes: any[], newEdges: any[]) => {
          if (positionUpdateTimeoutRef.current) {
            clearTimeout(positionUpdateTimeoutRef.current);
          }

          positionUpdateTimeoutRef.current = setTimeout(() => {
            updateGraphData(newNodes, newEdges, onUpdateStart, onUpdateEnd);
            positionUpdateTimeoutRef.current = null;
          }, 500);
        },
        [updateGraphData, onUpdateStart, onUpdateEnd]
      );

      // Edge change handling - now handles direct node relationship updates
      const onEdgesChangeCallback = useCallback(
        async (changes: any) => {
          const newEdges = applyEdgeChanges(changes, edges);
          setEdges(newEdges);

          const removedEdges = changes.filter(
            (change: any) => change.type === "remove"
          );

          for (const change of removedEdges) {
            const edgeId = change.id;
            const edge = edges.find((e) => e.id === edgeId);

            if (edge) {
              await deleteEdge(edge);
            }
          }
        },
        [edges, deleteEdge]
      );

      // Node change handling
      const onNodesChangeCallback = useCallback(
        async (changes: any) => {
          const deletionChanges = changes.filter(
            (change: any) => change.type === "remove"
          );
          const otherChanges = changes.filter(
            (change: any) => change.type !== "remove"
          );

          for (const change of deletionChanges) {
            const nodeId = change.id;
            await deleteNode(nodeId);
          }

          if (otherChanges.length > 0) {
            const newNodes = applyNodeChanges(otherChanges, nodes);
            setNodes(newNodes);

            const positionChanges = otherChanges.filter(
              (change: any) => change.type === "position" && change.position
            );

            if (positionChanges.length > 0) {
              debouncedUpdatePositions(newNodes, edges);
            }
          }
        },
        [nodes, edges, deleteNode, debouncedUpdatePositions]
      );

      // Connection handling
      const onConnect = useCallback(
        async (params: any) => {
          // Check if edge already exists
          const edgeExists = edges.some(
            (edge) =>
              edge.source === params.source && edge.target === params.target
          );

          if (edgeExists) {
            return;
          }

          // Find the source node
          const sourceNode = nodes.find(node => node.id === params.source);
          
          if (!sourceNode) {
            console.error('Source node not found:', params.source);
            return;
          }

          // Create a temporary edge for immediate UI feedback
          const newEdge: any = {
            id: `temp-${params.source}-${params.target}`,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
          };

          // Add the edge to UI state
          setEdges(prev => [...prev, newEdge]);

          // Create the actual edge in database
          const createdEdge = await createEdge(
            params.source,
            params.target,
            params.sourceHandle
          );

          if (!createdEdge) {
            console.error("Error creating edge");
            // Remove the temporary edge from UI
            setEdges(prev => prev.filter(e => e.id !== newEdge.id));
            return;
          }

          // Replace the temporary edge with the real one
          setEdges(prev => 
            prev.map(edge => 
              edge.id === newEdge.id ? createdEdge : edge
            )
          );

          await updateGraphData(nodes, [...edges, createdEdge], onUpdateStart, onUpdateEnd);
        },
        [nodes, edges, createEdge, updateGraphData, onUpdateStart, onUpdateEnd]
      );

      // Node click handling
      const onNodeClick = useCallback((event: any, node: any) => {
        event.stopPropagation();
        setSelectedNode(node);
      }, [setSelectedNode]);

      // Add node wrapper
      const handleAddNodeWrapper = useCallback(
        (type: any, label: string) => {
          handleAddNode(type, label, selectedNode, edges);
        },
        [handleAddNode, selectedNode, edges]
      );

      if (isLoading) {
        return (
          <div className="h-screen w-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          </div>
        );
      }

      // Render the graph content
      return (
        <div className={cn("h-screen w-screen", className)}>
          <ReactFlowProvider>
            <GraphContent
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChangeCallback}
              onEdgesChange={onEdgesChangeCallback}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                console.log('React Flow initialized with', nodes.length, 'nodes and', edges.length, 'edges');
              }}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              handleAddNode={handleAddNodeWrapper}
              isAddNodeDialogOpen={isAddNodeDialogOpen}
              setIsAddNodeDialogOpen={setIsAddNodeDialogOpen}
              isRootNode={nodes.filter(n => !n.id.toString().startsWith('analysis-')).length === 0}
              ref={ref}
            />
          </ReactFlowProvider>
        </div>
      );
    } catch (e) {
      console.error("Error in Graph component:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
      
      return (
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="text-red-600">Error loading graph. Check console for details.</div>
        </div>
      );
    }
  }
);

Graph.displayName = "Graph"; 