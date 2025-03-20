"use client";

import { useState } from "react";
import { Node, Edge } from "@xyflow/react";
import { JsonEditor } from "./components/JsonEditor";
import { Graph } from "./components/Graph";
import { convertJsonToFlow } from "@/lib/utils/flow";

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
    <div className="h-screen w-screen flex bg-background">
      <div className="w-1/3 p-4 border-r border-border">
        <JsonEditor
          jsonInput={jsonInput}
          onJsonChange={setJsonInput}
          onSubmit={handleJsonSubmit}
        />
      </div>
      <div className="flex-1">
        <Graph
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
        />
      </div>
    </div>
  );
}
