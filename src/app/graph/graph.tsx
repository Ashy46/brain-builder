"use client";

import {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { cn } from "@/lib/utils";
import { calculateNodePositions } from "@/app/graph/flow";
import { CustomNode } from "./custom-node";
import { CustomControls } from "./custom-controls";

// Define node types
const nodeTypes = {
  custom: CustomNode,
};

export interface GraphRef {
  fitView: () => void;
  addNode: (parentId?: string) => void;
}

interface GraphProps {
  initialJson: any;
  onJsonChange: (json: any) => void;
  className?: string;
}

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ initialJson, onJsonChange, className }, ref) => {
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isInteractive, setIsInteractive] = useState(true);

    // Initialize nodes and edges from JSON
    const initializeGraph = useCallback((json: any) => {
      const { nodes: newNodes, edges: newEdges } = calculateNodePositions(
        json,
        { x: 0, y: 0 }
      );
      setNodes(newNodes);
      setEdges(newEdges);
    }, []);

    // Update JSON when nodes change
    const updateJsonWithNodePositions = useCallback(
      (newNodes: Node[]) => {
        const updateNodePositions = (node: any) => {
          const flowNode = newNodes.find((n) => n.id === node.id);
          if (flowNode) {
            node.position = flowNode.position;
          }
          if (node.children) {
            node.children.forEach(updateNodePositions);
          }
        };

        const updatedJson = JSON.parse(JSON.stringify(initialJson));
        updateNodePositions(updatedJson);
        onJsonChange(updatedJson);
      },
      [initialJson, onJsonChange]
    );

    // Initialize on mount
    useState(() => {
      initializeGraph(initialJson);
    });

    useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance.current?.fitView();
      },
      addNode: (parentId?: string) => {
        const newNodeId = String(Date.now());
        const newNode = {
          id: newNodeId,
          label: "New Node",
          position: { x: 100, y: 100 },
        };

        const updatedJson = JSON.parse(JSON.stringify(initialJson));

        if (parentId) {
          // Add as child of selected node
          const addToParent = (node: any): boolean => {
            if (node.id === parentId) {
              if (!node.children) node.children = [];
              node.children.push(newNode);
              return true;
            }
            if (node.children) {
              return node.children.some(addToParent);
            }
            return false;
          };
          addToParent(updatedJson);
        } else {
          // Add to root level
          if (!updatedJson.children) updatedJson.children = [];
          updatedJson.children.push(newNode);
        }

        onJsonChange(updatedJson);
        initializeGraph(updatedJson);
      },
    }));

    const onNodesChangeCallback = useCallback(
      (changes: any) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(newNodes);
        updateJsonWithNodePositions(newNodes);
      },
      [nodes, updateJsonWithNodePositions]
    );

    const onEdgesChangeCallback = useCallback(
      (changes: any) => setEdges(applyEdgeChanges(changes, edges)),
      [edges]
    );

    const onConnect = useCallback(
      (params: any) => setEdges(addEdge(params, edges)),
      [edges]
    );

    return (
      <div className={cn("w-full h-full", className)}>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChangeCallback}
          edges={edges}
          onEdgesChange={onEdgesChangeCallback}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted"
          nodesConnectable={isInteractive}
          nodesDraggable={isInteractive}
          zoomOnScroll={isInteractive}
          panOnScroll={isInteractive}
          elementsSelectable={isInteractive}
        >
          <Background className="!bg-muted" />
          <CustomControls 
            isInteractive={isInteractive}
            onInteractivityChange={setIsInteractive}
          />
        </ReactFlow>
      </div>
    );
  }
);
