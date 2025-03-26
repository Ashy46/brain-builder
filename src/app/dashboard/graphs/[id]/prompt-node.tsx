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
import { createClient } from "@/lib/supabase/client/client";

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

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  useEffect(() => {
    async function updatePrompt() {
      const supabase = createClient();

      // Debug and validate data
      console.log("Node data:", data);
      if (!data.graphId) {
        console.error("graphId is undefined in node data");
        return;
      }

      const { data: graphData, error: fetchError } = await supabase
        .from("graphs")
        .select("nodes")
        .eq("id", data.graphId)
        .single();

      if (fetchError) {
        console.error("Error fetching graph:", fetchError);
        return;
      }

      let nodes = graphData.nodes || [];
      // Ensure nodes is an array
      if (!Array.isArray(nodes)) {
        nodes = [];
      }

      const nodeIndex = nodes.findIndex((node: any) => node.id === data.id);
      
      if (nodeIndex === -1) {
        // If node doesn't exist, add it
        nodes.push({
          id: data.id,
          type: data.type,
          label: data.label,
          position: data.position || { x: 0, y: 0 },
          prompt: prompt
        });
      } else {
        // Update existing node
        nodes[nodeIndex] = {
          ...nodes[nodeIndex],
          prompt: prompt
        };
      }

      const { error: updateError } = await supabase
        .from("graphs")
        .update({
          nodes: nodes
        })
        .eq("id", data.graphId);

      if (updateError) {
        console.error("Error updating prompt:", updateError);
      }
    }

    const debounceTimeout = setTimeout(() => {
      updatePrompt();
    }, 500); // Debounce updates to avoid too many database calls

    return () => clearTimeout(debounceTimeout);
  }, [prompt, data]);

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
