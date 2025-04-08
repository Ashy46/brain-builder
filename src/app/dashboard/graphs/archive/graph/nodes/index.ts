import { AnalysisNode } from "./analysis-node";
import { ConditionalNode } from "./conditional-node";
import { PromptNode } from "./prompt-node";

export * from "./types";
export * from "./analysis-node";
export * from "./conditional-node";
export * from "./prompt-node";

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
}; 