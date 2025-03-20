"use client";

import { useCallback, useRef, forwardRef, useImperativeHandle } from "react";

import {
  ReactFlow,
  Controls,
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

export interface GraphRef {
  fitView: () => void;
}

export const Graph = forwardRef<GraphRef, {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick?: (node: Node) => void;
  className?: string;
}>(({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  className,
}, ref) => {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  useImperativeHandle(ref, () => ({
    fitView: () => {
      reactFlowInstance.current?.fitView();
    }
  }));

  const onNodesChangeCallback = useCallback(
    (changes: any) => onNodesChange(applyNodeChanges(changes, nodes)),
    [nodes, onNodesChange]
  );
  const onEdgesChangeCallback = useCallback(
    (changes: any) => onEdgesChange(applyEdgeChanges(changes, edges)),
    [edges, onEdgesChange]
  );
  const onConnect = useCallback(
    (params: any) => onEdgesChange(addEdge(params, edges)),
    [edges, onEdgesChange]
  );

  return (
    <div className={cn("w-full h-full", className)}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChangeCallback}
        edges={edges}
        onEdgesChange={onEdgesChangeCallback}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        className="bg-muted"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
});
