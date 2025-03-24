import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export function Node({
  data,
  isConnectable,
  selected,
}: NodeProps & {
  data: { label: string };
  isConnectable: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-2 shadow-lg rounded-lg border bg-card text-card-foreground min-w-[150px]",
      selected && "border-2 border-primary"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />

      <div className="font-medium text-center">{data.label}</div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
    </div>
  );
}
