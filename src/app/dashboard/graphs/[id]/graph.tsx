import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Controls } from "./controls";

export function Graph() {
  return (
    <div className="h-full w-full relative">
      <ReactFlow fitView>
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
