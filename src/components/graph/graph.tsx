import { forwardRef, useCallback, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";

import { cn } from "@/lib/utils/tailwind";
import { useGraphData } from "./hooks";
import { useGraphOperations } from "./hooks";
import { GraphContent } from "./graph-content";
import { GraphProps, GraphRef } from "./types";

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
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

    const { createEdge, deleteEdge, deleteNode, handleAddNode } = useGraphOperations(
      graphId,
      updateNodeData,
      setNodes,
      setEdges,
      setSelectedNode
    );

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

    const onConnect = useCallback(
      async (params: any) => {
        const edgeExists = edges.some(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );

        if (edgeExists) {
          return;
        }

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

        setEdges((prev) =>
          prev.map((edge) =>
            edge.id === newEdge.id ? { ...edge, id: createdEdge.id } : edge
          )
        );

        await updateGraphData(nodes, newEdges, onUpdateStart, onUpdateEnd);
      },
      [nodes, edges, createEdge, updateGraphData, onUpdateStart, onUpdateEnd]
    );

    const onNodeClick = useCallback((event: any, node: any) => {
      event.stopPropagation();
      setSelectedNode(node);
    }, []);

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