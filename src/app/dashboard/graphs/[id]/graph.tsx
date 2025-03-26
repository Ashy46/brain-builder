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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

import {
  nodeTypes,
  NodeType,
  PromptNodeData,
  CustomNodeData,
  ConditionalNodeData,
  AnalysisNodeData,
} from "./nodes";
import { Controls } from "./controls";
import { AddNodeDialog } from "./add-node-dialog";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  position: { x: number; y: number };
  trueChildId?: string;
  falseChildId?: string;
  childId?: string;
  prompt?: string;
}

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
        hasAnalysisNode={nodes.some((node) => node.type === "analysis")}
      />
    </>
  );
}

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ graphId, className, onUpdateStart, onUpdateEnd }, ref) => {
    const { user } = useAuth();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);

    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

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
          type: node.type,
          data: {
            label: node.label,
            type: node.type,
            graphId,
            ...(node.type === "conditional" && {
              trueChildId: node.trueChildId,
              falseChildId: node.falseChildId,
            }),
            ...(node.type === "analysis" && {
              childId: node.childId,
            }),
            ...(node.type === "prompt" && {
              prompt: node.prompt || "",
            }),
          },
        }));

        const flowEdges: Edge[] = graphNodes.flatMap((node: GraphNode) => {
          const edges: Edge[] = [];

          if (node.type === "conditional") {
            if (node.trueChildId) {
              edges.push({
                id: `${node.id}-${node.trueChildId}-true`,
                source: node.id,
                target: node.trueChildId,
                sourceHandle: "true",
              });
            }
            if (node.falseChildId) {
              edges.push({
                id: `${node.id}-${node.falseChildId}-false`,
                source: node.id,
                target: node.falseChildId,
                sourceHandle: "false",
              });
            }
          } else if (node.type === "analysis" && node.childId) {
            edges.push({
              id: `${node.id}-${node.childId}`,
              source: node.id,
              target: node.childId,
            });
          }

          return edges;
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
        setIsLoading(false);
      }

      fetchGraph();
    }, [user, graphId, supabase]);

    const updateGraphData = useCallback(
      async (newNodes: Node[], newEdges: Edge[]) => {
        onUpdateStart?.();
        try {
          const graphNodes = newNodes.map((node) => {
            const nodeData = node.data as unknown as CustomNodeData;
            return {
              id: node.id,
              label: nodeData.label,
              type: nodeData.type,
              position: node.position,
              trueChildId:
                nodeData.type === "conditional"
                  ? (nodeData as ConditionalNodeData).trueChildId
                  : undefined,
              falseChildId:
                nodeData.type === "conditional"
                  ? (nodeData as ConditionalNodeData).falseChildId
                  : undefined,
              childId:
                nodeData.type === "analysis"
                  ? (nodeData as AnalysisNodeData).childId
                  : undefined,
              prompt:
                nodeData.type === "prompt"
                  ? (nodeData as PromptNodeData).prompt
                  : undefined,
            };
          });

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
      },
      [graphId, supabase, onUpdateStart, onUpdateEnd]
    );

    const onNodesChangeCallback = useCallback(
      async (changes: any) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(newNodes);

        await updateGraphData(newNodes, edges);
      },
      [nodes, edges, updateGraphData]
    );

    const handleNodeDataChange = useCallback(
      async (nodeId: string, newData: any) => {
        const newNodes = nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
          }
          return node;
        });
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
        const sourceNode = nodes.find((node) => node.id === params.source);
        const targetNode = nodes.find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) return;

        if (sourceNode.type === "analysis") {
          const newEdges = edges.filter(
            (edge) => edge.source !== sourceNode.id
          );

          const newEdge = {
            id: `${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
          };

          const updatedNodes = nodes.map((node) => {
            if (node.id === sourceNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  childId: targetNode.id,
                },
              };
            }
            return node;
          });

          setNodes(updatedNodes);
          setEdges([...newEdges, newEdge]);
          await updateGraphData(updatedNodes, [...newEdges, newEdge]);
          return;
        }

        if (sourceNode.type === "conditional") {
          const existingConnections = edges.filter(
            (edge) => edge.source === params.source
          );
          if (existingConnections.length >= 2) {
            return;
          }

          const existingHandleConnection = existingConnections.find(
            (edge) => edge.sourceHandle === params.sourceHandle
          );
          if (existingHandleConnection) {
            return;
          }

          const updatedNodes = nodes.map((node) => {
            if (node.id === sourceNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  [params.sourceHandle === "true"
                    ? "trueChildId"
                    : "falseChildId"]: targetNode.id,
                },
              };
            }
            return node;
          });
          setNodes(updatedNodes);

          const newEdge = {
            ...params,
            id: `${sourceNode.id}-${targetNode.id}-${params.sourceHandle}`,
          };
          const newEdges = addEdge(newEdge, edges);
          setEdges(newEdges);
          await updateGraphData(updatedNodes, newEdges);
          return;
        }

        if (sourceNode.type === "prompt") {
          return;
        }
      },
      [nodes, edges, updateGraphData]
    );

    const onNodeClick = useCallback((event: any, node: Node) => {
      event.stopPropagation();
      setSelectedNode(node);
    }, []);

    const handleAddNode = useCallback(
      (type: NodeType, label: string) => {
        const newNodeId = String(Date.now());
        const center = {
          x: 500,
          y: 300,
        };

        const newNode: Node = {
          id: newNodeId,
          position: center,
          data: {
            id: newNodeId,
            label,
            type,
            graphId,
            onNodeDataChange: handleNodeDataChange,
            ...(type === "prompt" && {
              prompt: "Act like a helpful assistant...",
            }),
          },
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
      },
      [
        nodes,
        edges,
        selectedNode,
        updateGraphData,
        graphId,
        handleNodeDataChange,
      ]
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
