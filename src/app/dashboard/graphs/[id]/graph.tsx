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
import { nodeTypes, NodeType } from "./nodes";
import { Controls } from "./controls";
import { AddNodeDialog } from "./add-node-dialog";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  position: { x: number; y: number };
  children: string[];
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
      >
        <Background />
        <Controls />
      </ReactFlow>
      <AddNodeDialog
        open={isAddNodeDialogOpen}
        onOpenChange={setIsAddNodeDialogOpen}
        onAddNode={handleAddNode}
        isRootNode={isRootNode}
      />
    </>
  );
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
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);

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
          data: { label: node.label, type: node.type },
          type: node.type,
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
        const graphNodes = newNodes.map(node => ({
          id: node.id,
          label: node.data.label,
          type: node.data.type,
          position: node.position,
          trueChildId: node.data.trueChildId,
          falseChildId: node.data.falseChildId,
          childId: node.data.childId,
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
        // Get source and target nodes
        const sourceNode = nodes.find(node => node.id === params.source);
        const targetNode = nodes.find(node => node.id === params.target);

        if (!sourceNode || !targetNode) return;

        // Analysis nodes can only have one child
        if (sourceNode.data.type === "analysis") {
          const existingConnections = edges.filter(edge => edge.source === params.source);
          if (existingConnections.length > 0) {
            return;
          }
          // Analysis nodes can only connect to conditional nodes
          if (targetNode.data.type !== "conditional") {
            return;
          }
        }

        // Conditional nodes can only have two children (true/false)
        if (sourceNode.data.type === "conditional") {
          const existingConnections = edges.filter(edge => edge.source === params.source);
          if (existingConnections.length >= 2) {
            return;
          }
          
          // Check if this handle type (true/false) already has a connection
          const existingHandleConnection = existingConnections.find(
            edge => edge.sourceHandle === params.sourceHandle
          );
          if (existingHandleConnection) {
            return;
          }

          // Update the node data with the appropriate child ID
          const updatedNodes = nodes.map(node => {
            if (node.id === sourceNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  [params.sourceHandle === "true" ? "trueChildId" : "falseChildId"]: targetNode.id
                }
              };
            }
            return node;
          });
          setNodes(updatedNodes);
        }

        // Prompt nodes cannot have children
        if (sourceNode.data.type === "prompt") {
          return;
        }

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

    const handleAddNode = useCallback((type: NodeType, label: string) => {
      const newNodeId = String(Date.now());
      const center = {
        x: 500,
        y: 300,
      };
      
      const newNode: Node = {
        id: newNodeId,
        position: center,
        data: { label, type },
        type,
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
    }, [nodes, edges, selectedNode, updateGraphData]);

    useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance.current?.fitView();
      },
      addNode: () => {
        setIsAddNodeDialogOpen(true);
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
