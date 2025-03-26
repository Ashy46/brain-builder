import { Handle, Position, NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

import { BaseNodeData, CustomNodeData, NodeTypeLabel, baseNodeStyles } from "./nodes";

export interface ConditionalNodeData extends BaseNodeData {
  type: "conditional";
  trueChildId?: string;
  falseChildId?: string;
}

export function ConditionalNode({
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
          "text-yellow-400 border-yellow-500/20",
          selected && "border-2 border-yellow-400/50"
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-yellow-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="text-sm text-center">{data.label}</div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          isConnectable={isConnectable}
          style={{ left: "30%" }}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          isConnectable={isConnectable}
          style={{ left: "70%" }}
          className="!bg-red-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>
    </div>
  );
}
