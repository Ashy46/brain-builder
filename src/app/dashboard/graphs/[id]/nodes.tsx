import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type NodeType = "analysis" | "conditional" | "prompt";

interface NodeData {
  label: string;
  type: NodeType;
}

export function AnalysisNode({
  data,
  isConnectable,
  selected,
}: NodeProps & {
  data: NodeData;
  isConnectable: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-2 shadow-lg rounded-lg border bg-blue-50 text-blue-900 min-w-[150px]",
      selected && "border-2 border-blue-500"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-background"
      />

      <div className="font-medium text-center">{data.label}</div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-background"
      />
    </div>
  );
}

export function ConditionalNode({
  data,
  isConnectable,
  selected,
}: NodeProps & {
  data: NodeData;
  isConnectable: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-2 shadow-lg rounded-lg border bg-yellow-50 text-yellow-900 min-w-[150px]",
      selected && "border-2 border-yellow-500"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-background"
      />

      <div className="font-medium text-center">{data.label}</div>

      <div className="flex justify-between mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          isConnectable={isConnectable}
          className="!bg-green-500 !w-3 !h-3 !border-2 !border-background"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          isConnectable={isConnectable}
          className="!bg-red-500 !w-3 !h-3 !border-2 !border-background"
        />
      </div>
    </div>
  );
}

export function PromptNode({
  data,
  isConnectable,
  selected,
}: NodeProps & {
  data: NodeData;
  isConnectable: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-2 shadow-lg rounded-lg border bg-green-50 text-green-900 min-w-[150px]",
      selected && "border-2 border-green-500"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-background"
      />

      <div className="font-medium text-center">{data.label}</div>
    </div>
  );
}

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
};
