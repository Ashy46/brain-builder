import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type NodeType = "analysis" | "conditional" | "prompt";

export interface BaseNodeData {
  label: string;
  type: NodeType;
}

export interface AnalysisNodeData extends BaseNodeData {
  type: "analysis";
  childId?: string;
}

export interface ConditionalNodeData extends BaseNodeData {
  type: "conditional";
  trueChildId?: string;
  falseChildId?: string;
}

export interface PromptNodeData extends BaseNodeData {
  type: "prompt";
}

export type CustomNodeData =
  | AnalysisNodeData
  | ConditionalNodeData
  | PromptNodeData;

export interface CustomNode {
  id: string;
  position: { x: number; y: number };
  data: CustomNodeData;
  type: NodeType;
}

function NodeTypeLabel({ type }: { type: NodeType }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "px-6 py-4 shadow-sm rounded-lg border min-w-[200px] min-h-[80px] backdrop-blur-[2px] bg-white/5";

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

export function PromptNode({
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
          "text-green-400 border-green-500/20",
          selected && "border-2 border-green-400/50"
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="text-sm text-center">{data.label}</div>
      </div>
    </div>
  );
}

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
};
