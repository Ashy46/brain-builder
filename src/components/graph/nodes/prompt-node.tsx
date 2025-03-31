import { Handle, Position } from "@xyflow/react";
import { useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

import { Button } from "@/components/ui/button";
import { EditNodeDialog } from "@/components/graph/dialogs/edit-node-dialog";
import { NodePropsWithData, PromptNodeData } from "./types";

function NodeTypeLabel({ type }: { type: string }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-3 px-4 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function PromptNode({
  data,
  isConnectable,
  selected,
  id,
}: NodePropsWithData) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);
  const [isEditing, setIsEditing] = useState(false);
  const promptData = data as PromptNodeData;

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
      const newWidth = Math.max(200, tempSpan.offsetWidth + 80);
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-green-500/20",
          selected && "border-2 border-green-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="flex items-center justify-between">
          <input
            ref={labelRef}
            type="text"
            value={data.label}
            onChange={handleLabelChange}
            onKeyDown={handleKeyDown}
            className="w-full text-sm text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            aria-label="Node label"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditNodeDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        nodeId={id}
        nodeLabel={data.label}
        nodePrompt={promptData.prompt}
        nodeType="Prompt"
        onLabelChange={data.onLabelChange || (() => {})}
        onPromptChange={promptData.onPromptChange || (() => {})}
      />
    </div>
  );
} 