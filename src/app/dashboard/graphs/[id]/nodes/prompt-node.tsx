"use client";

import { useEffect, useState } from "react";

import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { EditPromptDialog } from "@/app/dashboard/prompts/edit-prompt-dialog";
import { LabelledNode } from "./base/labelled-node";

export function PromptNode({ data }: { data: any }) {
  const { user } = useAuth();

  const [prompt, setPrompt] = useState<Tables<"user_prompts">>();

  useEffect(() => {
    if (!data.id) return;

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

    fetchPrompt();
  }, [data.id, user]);

  return (
    <LabelledNode id={data.id} title="Prompt">
      <Handle type="target" position={Position.Top} />

      <div className="flex flex-col gap-2">
        {prompt && <EditPromptDialog prompt={prompt} />}
      </div>
    </LabelledNode>
  );
}
