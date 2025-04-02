import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
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
  const [width] = useState(200);
  const [isEditing, setIsEditing] = useState(false);
  const promptData = data as PromptNodeData;

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
      </div>

      <EditNodeDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="node"
        nodeId={id}
        nodeLabel={data.label}
        nodePrompt={promptData.prompt}
        nodeType="Prompt"
        llmConfig={promptData.llmConfig}
        onLabelChange={data.onLabelChange || (() => {})}
        onPromptChange={(nodeId, newData) => {
          if (promptData.onPromptChange) {
            // Save the new prompt and LLM config with required fields
            promptData.onPromptChange(nodeId, {
              type: "prompt",
              label: data.label,
              graphId: promptData.graphId,
              prompt: newData.prompt,
              llmConfig: {
                model: newData.llmConfig.model,
                temperature: newData.llmConfig.temperature,
                maxTokens: newData.llmConfig.maxTokens,
                frequencyPenalty: newData.llmConfig.frequencyPenalty,
                presencePenalty: newData.llmConfig.presencePenalty,
                topP: newData.llmConfig.topP
              }
            });
          }
        }}
        onLLMConfigChange={(nodeId, config) => {
          if (promptData.onPromptChange) {
            // Update the LLM config while preserving the current prompt
            promptData.onPromptChange(nodeId, {
              type: "prompt",
              label: data.label,
              graphId: promptData.graphId,
              prompt: promptData.prompt,
              llmConfig: {
                model: config.model,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                frequencyPenalty: config.frequencyPenalty,
                presencePenalty: config.presencePenalty,
                topP: config.topP
              }
            });
          }
        }}
      />
    </div>
  );
} 