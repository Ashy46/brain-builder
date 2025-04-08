import { AnalysisNode } from './analysis-node';
import { ConditionalNode } from './conditional-node';
import { PromptNode } from './prompt-node';

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
};

export type NodeType = 'prompt' | 'conditional' | 'analysis'; 