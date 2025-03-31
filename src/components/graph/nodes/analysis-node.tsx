import { Handle, Position } from "@xyflow/react";
import { useRef, useState } from "react";
import {
  ArrowLeftRight,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

import { SelectStatesDialog } from "@/components/graph/dialogs";
import { Button } from "@/components/ui/button";
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
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);
  const [isSelectingStates, setIsSelectingStates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    if (labelRef.current) {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 140);
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
  };

  const analysisData = data as AnalysisNodeData;
  const selectedStatesCount = analysisData.selectedStates?.length || 0;

  const handleStatesChange = (stateIds: string[]) => {
    analysisData.onStatesChange?.(id, stateIds);
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
        style={{ width: `${width}px` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-center w-full">
            {data.label}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="size-7"
          >
            <Pencil className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2 text-sm">
          <Button
            onClick={() => setIsSelectingStates(true)}
            variant="outline"
            size="sm"
          >
            <ArrowLeftRight className="h-4 w-4" />
            States: {selectedStatesCount} selected
          </Button>
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
        selectedStateIds={analysisData.selectedStates || []}
        onStatesChange={handleStatesChange}
      />

      <EditNodeDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        nodeId={id}
        nodeLabel={data.label}
        nodePrompt={analysisData.prompt}
        nodeType="Analysis"
        onLabelChange={data.onLabelChange || (() => {})}
        onPromptChange={analysisData.onPromptChange || (() => {})}
      />
    </div>
  );
} 