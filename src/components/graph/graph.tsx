import { forwardRef, useCallback, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";

import { cn } from "@/lib/utils/tailwind";
import { useGraphData } from "./hooks";
import { useGraphOperations } from "./hooks";
import { GraphContent } from "./graph-content";
import { GraphProps, GraphRef } from "./types";
import { createClient } from "@/lib/supabase/client";

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
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

    // Create edge function
    const createEdge = useCallback(async (sourceId: string, targetId: string, sourceHandle?: string) => {
      console.log('Creating edge with params:', { sourceId, targetId, sourceHandle, graphId });

      try {
        const { data: edge, error } = await supabase
          .from('graph_node_edges')
          .insert({
            source_node_id: sourceId,
            target_node_id: targetId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating edge:', error);
          return null;
        }

        return edge;
      } catch (err) {
        console.error('Unexpected error creating edge:', err);
        return null;
      }
    }, [graphId, supabase]);

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

    // Edge change handling
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
            await deleteEdge(edgeId);
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
        const edgeExists = edges.some(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );

        if (edgeExists) {
          return;
        }

        // Find the source node to check if it's a conditional node
        const sourceNode = nodes.find(node => node.id === params.source);
        const isConditionalNode = sourceNode?.type === 'conditional';

        const newEdge: any = {
          id: "",
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
        };

        const newEdges = [...edges, newEdge];
        setEdges(newEdges);

        const createdEdge = await createEdge(
          params.source,
          params.target,
          params.sourceHandle
        );

        if (!createdEdge) {
          console.error("Error creating edge");
          return;
        }

        // If this is a conditional node connection, update the parent node's data
        if (isConditionalNode && params.sourceHandle) {
          const updateData: any = {};
          if (params.sourceHandle === 'true') {
            updateData.trueChildId = params.target;
          } else if (params.sourceHandle === 'false') {
            updateData.falseChildId = params.target;
          }

          if (Object.keys(updateData).length > 0) {
            await updateNodeData(params.source, updateData);
          }
        }

        setEdges((prev) =>
          prev.map((edge) =>
            edge.id === newEdge.id ? { ...edge, id: createdEdge.id } : edge
          )
        );

        await updateGraphData(nodes, newEdges, onUpdateStart, onUpdateEnd);
      },
      [nodes, edges, createEdge, updateNodeData, updateGraphData, onUpdateStart, onUpdateEnd]
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
            }}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            handleAddNode={handleAddNodeWrapper}
            isAddNodeDialogOpen={isAddNodeDialogOpen}
            setIsAddNodeDialogOpen={setIsAddNodeDialogOpen}
            isRootNode={nodes.length === 0}
            ref={ref}
          />
        </ReactFlowProvider>
      </div>
    );
  }
);

Graph.displayName = "Graph"; 