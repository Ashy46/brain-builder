import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { NodeType, CustomNodeData, AnalysisNodeData, ConditionalNodeData, PromptNodeData } from "./nodes";

export interface GraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  data: {
    type: NodeType;
    prompt?: string;
    childId?: string;
    trueChildId?: string;
    falseChildId?: string;
  };
}

export interface GraphRef {
  fitView: () => void;
  addNode: () => void;
  selectedNode: Node | null;
}

export interface GraphProps {
  graphId: string;
  className?: string;
  onUpdateStart?: () => void;
  onUpdateEnd?: () => void;
}

export interface FlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: any, node: Node) => void;
  onInit: (instance: ReactFlowInstance) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  handleAddNode: (type: NodeType, label: string) => void;
  isAddNodeDialogOpen: boolean;
  setIsAddNodeDialogOpen: (open: boolean) => void;
  isRootNode: boolean;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isLoading: boolean;
  isAddNodeDialogOpen: boolean;
} 