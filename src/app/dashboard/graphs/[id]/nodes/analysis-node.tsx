"use client";

import { Handle, Position } from "@xyflow/react";

export function AnalysisNode() {
  return (
    <>
      <div className="rounded-full bg-gray-200 p-2">
        <span>I'm analyzing!</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="analysis-node-output"
      />
    </>
  );
}
