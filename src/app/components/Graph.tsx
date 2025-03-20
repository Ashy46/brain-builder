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

interface GraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export function Graph({ nodes, edges, onNodesChange, onEdgesChange }: GraphProps) {
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
    <div className="w-full h-full">
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