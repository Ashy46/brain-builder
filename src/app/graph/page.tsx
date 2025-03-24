"use client";

import { useState, useEffect, useRef } from "react";
import { Graph, GraphRef } from "@/app/graph/graph";
import { CodeEditor } from "@/app/graph/code-editor";

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
  const graphRef = useRef<GraphRef>(null);

  const handleJsonSubmit = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  const handleJsonChange = (newJson: any) => {
    setJsonInput(JSON.stringify(newJson, null, 2));
  };

  const handleAddNode = () => {
    graphRef.current?.addNode();
  };

  return (
    <div className="h-screen w-screen flex bg-background">
      <div className="w-1/3 p-4 border-r border-border flex flex-col">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={handleAddNode}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add New Node
          </button>
          <button
            onClick={handleJsonSubmit}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Apply JSON
          </button>
        </div>
        <CodeEditor value={jsonInput} onChange={setJsonInput} language="json" />
      </div>
      <div className="flex-1">
        <Graph
          ref={graphRef}
          initialJson={JSON.parse(jsonInput)}
          onJsonChange={handleJsonChange}
        />
      </div>
    </div>
  );
}
