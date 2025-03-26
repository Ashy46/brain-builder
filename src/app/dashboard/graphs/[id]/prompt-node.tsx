import { useEffect, useState } from "react";

import { Handle, NodeProps, Position } from "@xyflow/react";

import { cn } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";

import {
  baseNodeStyles,
  CustomNodeData,
  NodeTypeLabel,
  BaseNodeData,
} from "./nodes";

export interface PromptNodeData extends BaseNodeData {
  type: "prompt";
  prompt: string;
}

export function PromptNode({
  data,
  isConnectable,
  selected,
}: NodeProps & { data: CustomNodeData; selected?: boolean }) {
  const [prompt, setPrompt] = useState((data as PromptNodeData).prompt);

  // Update local state when data changes
  useEffect(() => {
    setPrompt((data as PromptNodeData).prompt);
  }, [data]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    
    // Update the node data through the parent component
    if (data.onNodeDataChange) {
      data.onNodeDataChange(data.id, {
        ...data,
        prompt: newPrompt
      });
    }
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          " border-green-500/20",
          selected && "border-2 border-green-400/50"
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="text-sm font-medium text-center mb-1">{data.label}</div>
        <Textarea
          className="w-full text-sm bg-transparent min-h-[60px] resize-none focus:ring-0 focus:ring-offset-0"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={handlePromptChange}
        />
      </div>
    </div>
  );
}
