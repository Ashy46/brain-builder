import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Controls } from "./controls";

const nodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start" },
    position: { x: 0, y: 0 },
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

const edges = [
  { id: "1", source: "1", target: "2" },
  { id: "2", source: "2", target: "3" },
];

export function Graph() {
  return (
    <div className="h-full w-full relative">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
