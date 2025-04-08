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
];

export function Graph() {
  return (
    <div className="h-full w-full relative">
      <ReactFlow nodes={nodes} fitView>
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
