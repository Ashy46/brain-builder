"use client";

import { useState, useCallback } from "react";
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
import { convertJsonToFlow } from "./utils/nodeConverter";

const defaultJson = {
  id: "1",
  label: "Root",
  children: [
    {
      id: "2",
      label: "Child 1",
      children: [
        {
          id: "4",
          label: "Grandchild 1",
        },
      ],
    },
    {
      id: "3",
      label: "Child 2",
    },
  ],
};

export default function Home() {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(defaultJson, null, 2)
  );
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds: any) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds: any) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds: any) => addEdge(params, eds)),
    []
  );

  const handleJsonSubmit = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      const { nodes: newNodes, edges: newEdges } = convertJsonToFlow(jsonData);
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  return (
    <div className="h-screen w-screen flex">
      <div className="w-1/3 p-4 border-r">
        <label htmlFor="json-input" className="block mb-2 font-medium">
          Node Structure (JSON)
        </label>
        <textarea
          id="json-input"
          className="w-full h-96 p-2 font-mono text-sm"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Enter JSON structure for nodes..."
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleJsonSubmit}
        >
          Update Graph
        </button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
