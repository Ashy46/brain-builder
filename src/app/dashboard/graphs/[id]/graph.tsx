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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { cn } from "@/lib/utils";
import { Node as CustomNode } from "./nodes";
import { Controls } from "./controls";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

export interface GraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  children: string[];
}

const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 200;

const nodeTypes = {
  custom: CustomNode,
};

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

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const { user } = useAuth();
    const supabase = createClient();
    
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    useEffect(() => {
      async function fetchGraph() {
        if (!user || !graphId) return;
        setIsLoading(true);

        const { data, error } = await supabase
          .from("graphs")
          .select("*")
          .eq("id", graphId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching graph:", error);
          return;
        }

        if (!data) {
          console.error("No graph data found");
          return;
        }

        const graphNodes = Array.isArray(data.nodes) ? data.nodes : [];
        
        const flowNodes: Node[] = graphNodes.map((node: GraphNode) => ({
          id: node.id,
          position: node.position,
          data: { label: node.label },
          type: "custom",
        }));

        const flowEdges: Edge[] = graphNodes.flatMap((node: GraphNode) =>
          node.children.map((childId) => ({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
          }))
        );

        setNodes(flowNodes);
        setEdges(flowEdges);
        setIsLoading(false);
      }

      fetchGraph();
    }, [user, graphId, supabase]);

    const updateGraphData = useCallback(async (newNodes: Node[], newEdges: Edge[]) => {
      onUpdateStart?.();
      try {
        const graphNodes: GraphNode[] = newNodes.map(node => ({
          id: node.id,
          label: node.data.label as string,
          position: node.position,
          children: newEdges
            .filter(edge => edge.source === node.id)
            .map(edge => edge.target),
        }));

        const { error } = await supabase
          .from("graphs")
          .update({ nodes: graphNodes })
          .eq("id", graphId);

        if (error) {
          console.error("Error updating graph:", error);
          return false;
        }

        return true;
      } finally {
        onUpdateEnd?.();
      }
    }, [graphId, supabase, onUpdateStart, onUpdateEnd]);

    const onNodesChangeCallback = useCallback(
      async (changes: any) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(newNodes);

        await updateGraphData(newNodes, edges);
      },
      [nodes, edges, updateGraphData]
    );

    const onEdgesChangeCallback = useCallback(
      async (changes: any) => {
        const newEdges = applyEdgeChanges(changes, edges);
        setEdges(newEdges);

        await updateGraphData(nodes, newEdges);
      },
      [nodes, edges, updateGraphData]
    );

    const onConnect = useCallback(
      async (params: any) => {
        const newEdges = addEdge(params, edges);
        setEdges(newEdges);

        await updateGraphData(nodes, newEdges);
      },
      [nodes, edges, updateGraphData]
    );

    const onNodeClick = useCallback((event: any, node: Node) => {
      event.stopPropagation();
      setSelectedNode(node);
    }, []);

    useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance.current?.fitView();
      },
      addNode: () => {
        const newNodeId = String(Date.now());
        const newNode: Node = {
          id: newNodeId,
          position: { x: 100, y: 100 },
          data: { label: "New Node" },
          type: "custom",
        };

        const newNodes = [...nodes, newNode];
        setNodes(newNodes);

        if (selectedNode) {
          const newEdge: Edge = {
            id: `${selectedNode.id}-${newNodeId}`,
            source: selectedNode.id,
            target: newNodeId,
          };
          const newEdges = [...edges, newEdge];
          setEdges(newEdges);
          updateGraphData(newNodes, newEdges);
        } else {
          updateGraphData(newNodes, edges);
        }
      },
      selectedNode,
    }));

    if (isLoading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      );
    }

    return (
      <div className={cn("h-screen w-screen", className)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeCallback}
          onEdgesChange={onEdgesChangeCallback}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    );
  }
);

Graph.displayName = "Graph";
