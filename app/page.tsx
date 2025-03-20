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
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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

  const handleFormatJson = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background">
      <div className="w-1/3 p-4 border-r border-border flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="json-input" className="font-medium">
            Node Structure (JSON)
          </label>
          <Button variant="outline" size="sm" onClick={handleFormatJson}>
            Format JSON
          </Button>
        </div>
        <div className="relative flex-1 rounded-md border border-border">
          <textarea
            id="json-input"
            className="absolute inset-0 w-full h-full p-2 font-mono text-sm bg-transparent resize-none outline-none text-transparent caret-foreground selection:bg-muted"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Enter JSON structure for nodes..."
            spellCheck={false}
          />
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              height: "100%",
              background: "transparent",
              padding: "0.5rem",
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
            showLineNumbers
            wrapLines
            wrapLongLines
          >
            {jsonInput}
          </SyntaxHighlighter>
        </div>
        <Button className="mt-2" onClick={handleJsonSubmit}>
          Update Graph
        </Button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-muted"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
