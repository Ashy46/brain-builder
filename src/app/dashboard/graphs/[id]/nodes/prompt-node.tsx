"use client";

import { useEffect, useState } from "react";

import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { debounce } from "lodash";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Input } from "@/components/ui/input";

import { EditPromptDialog } from "@/app/dashboard/prompts/edit-prompt-dialog";

export function PromptNode({ data }: { data: any }) {
  const { user } = useAuth();

  const [label, setLabel] = useState("");
  const [prompt, setPrompt] = useState<Tables<"user_prompts"> | null>(null);

  useEffect(() => {
    if (data.label !== undefined) {
      setLabel(data.label);
    }
  }, [data.label]);

  const debouncedUpdateLabel = debounce(async (newLabel: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("graph_nodes")
      .update({ label: newLabel })
      .eq("id", data.id);

    if (error) {
      console.error("Error updating node label:", error);
    }
  }, 500);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    debouncedUpdateLabel(newLabel);
  };

  useEffect(() => {
    if (!data.id) return;

    const fetchLabel = async () => {
      const supabase = createClient();

      const { data: nodeData, error } = await supabase
        .from("graph_nodes")
        .select("label")
        .eq("id", data.id)
        .single();

      if (error) {
        console.error("Error fetching node label:", error);
        return;
      }

      if (nodeData?.label) {
        setLabel(nodeData.label);
      }
    };

    const fetchPrompt = async () => {
      const supabase = createClient();

      const { data: promptNodeData, error: promptNodeError } = await supabase
        .from("graph_prompt_nodes")
        .select("prompt_id")
        .eq("graph_node_id", data.id)
        .single();

      if (promptNodeError) {
        console.error("Error fetching prompt node:", promptNodeError);
        return;
      }

      if (!promptNodeData.prompt_id) {
        console.log("No prompt ID found for prompt node");

        const { data: insertedPrompt, error: insertError } = await supabase
          .from("user_prompts")
          .insert({
            user_id: user?.id,
            content: "This is a prompt",
            description: "This is a description",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting prompt:", insertError);
          return;
        }

        const {
          data: updateGraphPromptNode,
          error: updateGraphPromptNodeError,
        } = await supabase
          .from("graph_prompt_nodes")
          .update({
            prompt_id: insertedPrompt.id,
          })
          .eq("graph_node_id", data.id);

        if (updateGraphPromptNodeError) {
          console.error(
            "Error updating graph prompt node:",
            updateGraphPromptNodeError
          );
          return;
        }
      }

      const { data: promptData, error: promptError } = await supabase
        .from("user_prompts")
        .select("*")
        .eq("id", promptNodeData.prompt_id)
        .single();

      if (promptError) {
        console.error("Error fetching prompt:", promptError);
        return;
      }

      setPrompt(promptData);
    };

    fetchLabel();
    fetchPrompt();
  }, [data.id, user]);

  return (
    <div className="rounded-2xl bg-muted/40 border backdrop-blur-md p-4 space-y-3 min-w-[340px]">
      <Handle type="target" position={Position.Top} />

      <span className="text-md text-center font-medium flex flex-col gap-3">
        Prompt
      </span>

      <Input
        value={label}
        onChange={handleLabelChange}
        className="w-full nodrag"
      />

      <div className="flex flex-col gap-2">
        {prompt && <EditPromptDialog prompt={prompt} />}
      </div>
    </div>
  );
}
