import { Tables, Enums } from "@/types/supabase";
import { NodeType } from "@/app/dashboard/graphs/archive/graph/nodes";

export interface NodeTypeSelectionProps {
  onSelect: (type: "prompt" | "conditional") => void;
}

export interface PromptNodeConfigProps {
  onBack: () => void;
  onComplete: (label: string, promptId: string) => void;
}

export interface ConditionalNodeConfigProps {
  onBack: () => void;
  onComplete: (label: string, stateId: string, operator: Enums<"conditional_operator">, value: string) => void;
  graphId: string;
}

export interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (type: NodeType, label: string, config?: any) => void;
  graphId: string;
  isRootNode?: boolean;
} 