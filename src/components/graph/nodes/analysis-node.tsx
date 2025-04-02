import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import {
  ArrowLeftRight,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

import { SelectStatesDialog } from "@/components/graph/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NodePropsWithData, AnalysisNodeData } from "./types";
import { EditNodeDialog } from "@/components/graph/dialogs/edit-node-dialog";

function NodeTypeLabel({ type }: { type: string }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-3 px-4 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function AnalysisNode({
  data,
  isConnectable,
  selected,
  id,
}: NodePropsWithData) {
  const [isSelectingStates, setIsSelectingStates] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);

  const analysisData = data as AnalysisNodeData;
  const selectedStates = analysisData.selectedStates || [];

  const handleStatesChange = (stateIds: string[]) => {
    analysisData.onStatesChange?.(id, stateIds);
  };

  const handleStatePromptChange = (stateId: string, prompt: string, llmConfig?: any) => {
    analysisData.onStatePromptChange?.(id, stateId, prompt, llmConfig);
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-blue-500/20",
          selected && "border-2 border-blue-400/50"
        )}
        style={{ width: "300px" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Analysis Node</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectingStates(true)}
            className="h-7"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Manage States
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedStates.map((stateId) => {
            const statePrompt = analysisData.statePrompts?.find(
              (sp) => sp.stateId === stateId
            );
            return (
              <Badge
                key={stateId}
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => setEditingStateId(stateId)}
              >
                {stateId}
                <Pencil className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>

      <SelectStatesDialog
        open={isSelectingStates}
        onOpenChange={setIsSelectingStates}
        graphId={analysisData.graphId}
        selectedStateIds={selectedStates}
        onStatesChange={handleStatesChange}
      />

      {editingStateId && (
        <EditNodeDialog
          open={!!editingStateId}
          onOpenChange={(open) => !open && setEditingStateId(null)}
          nodeId={id}
          nodeLabel={editingStateId}
          nodePrompt={analysisData.statePrompts?.find(
            (sp) => sp.stateId === editingStateId
          )?.prompt || ""}
          nodeType="Analysis"
          onLabelChange={() => {}}
          onPromptChange={(nodeId, newData) => {
            handleStatePromptChange(editingStateId, newData.prompt);
            setEditingStateId(null);
          }}
        />
      )}
    </div>
  );
} 