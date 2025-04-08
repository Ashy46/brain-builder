"use client";

import { useState, useCallback } from "react";

import {
  ReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Controls } from "./controls";
import { AnalysisNode } from "./nodes/analysis-node";

const nodeTypes = {
  analysis: AnalysisNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "analysis",
    data: { label: "Start" },
    position: { x: 0, y: 0 },
    draggable: false,
  },
  {
    id: "2",
    type: "default",
    data: { label: "Node 1" },
    position: { x: 0, y: 100 },
  },
  {
    id: "3",
    type: "output",
    data: { label: "End" },
    position: { x: 0, y: 200 },
  },
];

const initialEdges: Edge[] = [
  { id: "1", source: "1", target: "2" },
  { id: "2", source: "2", target: "3" },
];

export function Graph() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
