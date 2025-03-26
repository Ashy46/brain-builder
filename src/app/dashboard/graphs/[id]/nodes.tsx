import { ConditionalNode, ConditionalNodeData } from "./conditional-node";
import { AnalysisNode, AnalysisNodeData } from "./analysis-node";
import { PromptNode, PromptNodeData } from "./prompt-node";

export type NodeType = "analysis" | "conditional" | "prompt";

export interface BaseNodeData {
  id: string;
  label: string;
  type: NodeType;
  graphId: string;
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

export function NodeTypeLabel({ type }: { type: NodeType }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-muted-foreground text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

export const baseNodeStyles =
  "px-4 py-3 shadow-sm rounded-lg border min-w-[200px] min-h-[80px] backdrop-blur-[2px] bg-white/5";

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
};
