"use client";

import { useCallback } from "react";

import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { cn } from "@/lib/utils";

export function Graph({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  className,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  className?: string;
}) {
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
        fitView
        className="bg-muted"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
