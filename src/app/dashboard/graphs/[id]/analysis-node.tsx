import { NodeProps, Handle, Position } from "@xyflow/react";

import {
  baseNodeStyles,
  CustomNodeData,
  NodeTypeLabel,
  BaseNodeData,
} from "./nodes";

import { cn } from "@/lib/utils";

export interface AnalysisNodeData extends BaseNodeData {
  type: "analysis";
  childId?: string;
}

export function AnalysisNode({
  data,
  isConnectable,
  selected,
}: NodeProps & { data: CustomNodeData; selected?: boolean }) {
  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "text-blue-400 border-blue-500/20",
          selected && "border-2 border-blue-400/50"
        )}
      >
        <div className="text-sm text-center">{data.label}</div>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>
    </div>
  );
}
