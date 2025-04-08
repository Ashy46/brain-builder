import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { ArrowLeftRight, Pencil } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

import { Button } from "@/components/ui/button";
import { BuildConditionalDialog } from "@/components/graph/dialogs";
import { EditNodeDialog } from "@/app/dashboard/graphs/archive/graph/dialogs/edit-node-dialog";
import { NodePropsWithData, ConditionalNodeData } from "./types";

function NodeTypeLabel({ type }: { type: string }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-3 px-4 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function ConditionalNode({
  data,
  isConnectable,
  selected,
  id,
}: NodePropsWithData) {
  const [width] = useState(200);
  const [isBuildingConditional, setIsBuildingConditional] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const conditionalData = data as ConditionalNodeData;
  const conditionsCount = conditionalData.conditions?.length || 0;

  const handleConditionalChange = (newData: ConditionalNodeData) => {
    conditionalData.onConditionalChange?.(id, newData);
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-yellow-500/20",
          selected && "border-2 border-yellow-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-yellow-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="flex items-center justify-between">
          <span className="text-sm text-center w-full">{data.label}</span>
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
            onClick={() => setIsBuildingConditional(true)}
            variant="outline"
            size="sm"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Conditions: {conditionsCount} set
          </Button>
        </div>

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

      <BuildConditionalDialog
        open={isBuildingConditional}
        onOpenChange={setIsBuildingConditional}
        graphId={conditionalData.graphId}
        data={{
          type: "conditional",
          label: conditionalData.label,
          conditions: conditionalData.conditions || [],
          operator: conditionalData.operator || "and",
          graphId: conditionalData.graphId,
          onConditionalChange: conditionalData.onConditionalChange,
        }}
        onConditionalChange={handleConditionalChange}
      />

      <EditNodeDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        nodeId={id}
        nodeLabel={data.label}
        nodeType="Conditional"
        onLabelChange={data.onLabelChange || (() => {})}
        onPromptChange={() => {}}
      />
    </div>
  );
}
