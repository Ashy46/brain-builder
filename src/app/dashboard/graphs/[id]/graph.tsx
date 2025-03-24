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
import { CustomNode } from "./nodes";
import { Controls } from "./controls";

// Types
export interface JsonNode {
  id: string;
  label: string;
  position?: { x: number; y: number };
  children?: JsonNode[];
}

// Flow utilities
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 200;

export function calculateNodePositions(
  jsonNode: JsonNode,
  startPosition: XYPosition,
  level: number = 0
): { nodes: Node[]; edges: Edge[]; width: number } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const currentNode: Node = {
    id: jsonNode.id,
    position: startPosition,
    data: { label: jsonNode.label },
    type: "custom",
  };
  nodes.push(currentNode);

  if (!jsonNode.children || jsonNode.children.length === 0) {
    return { nodes, edges, width: 0 };
  }

  const children = jsonNode.children;
  const childResults = children.map((child, index) => {
    const childStartX =
      startPosition.x -
      (HORIZONTAL_SPACING * (children.length - 1)) / 2 +
      HORIZONTAL_SPACING * index;
    const childStartY = startPosition.y + VERTICAL_SPACING;

    return calculateNodePositions(
      child,
      { x: childStartX, y: childStartY },
      level + 1
    );
  });

  childResults.forEach((result, index) => {
    nodes.push(...result.nodes);
    edges.push(...result.edges);

    edges.push({
      id: `${jsonNode.id}-${children[index].id}`,
      source: jsonNode.id,
      target: children[index].id,
    });
  });

  const totalWidth = Math.max(
    ...childResults.map((result) => result.width),
    HORIZONTAL_SPACING * (children.length - 1)
  );

  return { nodes, edges, width: totalWidth };
}

export function convertJsonToFlow(jsonNode: JsonNode): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function processNode(node: JsonNode, level: number = 0) {
    const currentNode: Node = {
      id: node.id,
      position: node.position || { x: 0, y: 0 },
      data: { label: node.label },
      type: "custom",
    };
    nodes.push(currentNode);

    if (node.children) {
      node.children.forEach((child) => {
        processNode(child, level + 1);
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
        });
      });
    }
  }

  processNode(jsonNode);
  return { nodes, edges };
}

// Define node types
const nodeTypes = {
  custom: CustomNode,
};

export interface GraphRef {
  fitView: () => void;
  addNode: (parentId?: string) => void;
}

interface GraphProps {
  initialJson: JsonNode;
  onJsonChange: (json: JsonNode) => void;
  className?: string;
}

export const Graph = forwardRef<GraphRef, GraphProps>(
  ({ initialJson, onJsonChange, className }, ref) => {
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isInteractive, setIsInteractive] = useState(true);

    const initializeGraph = useCallback((json: JsonNode) => {
      if (!json || typeof json !== 'object') {
        console.error('Invalid JSON data:', json);
        return;
      }

      try {
        const { nodes: newNodes, edges: newEdges } = calculateNodePositions(
          json,
          { x: 0, y: 0 }
        );
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Error initializing graph:', error);
      }
    }, []);

    const updateJsonWithNodePositions = useCallback(
      (newNodes: Node[]) => {
        const updateNodePositions = (node: JsonNode) => {
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

    useEffect(() => {
      if (initialJson) {
        initializeGraph(initialJson);
      }
    }, [initialJson, initializeGraph]);

    useImperativeHandle(ref, () => ({
      fitView: () => {
        reactFlowInstance.current?.fitView();
      },
      addNode: (parentId?: string) => {
        const newNodeId = String(Date.now());
        const newNode: JsonNode = {
          id: newNodeId,
          label: "New Node",
          position: { x: 100, y: 100 },
        };

        const updatedJson = JSON.parse(JSON.stringify(initialJson));

        if (parentId) {
          // Add as child of selected node
          const addToParent = (node: JsonNode): boolean => {
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
          <Controls 
            isInteractive={isInteractive}
            onInteractivityChange={setIsInteractive}
          />
        </ReactFlow>
      </div>
    );
  }
);

Graph.displayName = "Graph";
