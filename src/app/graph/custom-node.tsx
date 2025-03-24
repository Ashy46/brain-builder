import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: { label: string };
  isConnectable: boolean;
}

export function CustomNode({ data, isConnectable }: CustomNodeProps) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg border bg-card text-card-foreground min-w-[150px]">
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