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

      // Fetch prompt through graph_prompt_nodes
      const { data: promptNodeData, error: promptNodeError } = await supabase
        .from("graph_prompt_nodes")
        .select("prompt_id")
        .eq("graph_node_id", data.id)
        .single();

      if (promptNodeError) {
        console.error("Error fetching prompt node:", promptNodeError);
        return;
      }

      if (promptNodeData?.prompt_id) {
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
      } else if (user) {
        const { data: newPrompt, error: createError } = await supabase
          .from("user_prompts")
          .insert({
            description: "Default prompt",
            content: "Hey, this is a test prompt. Edit this to your fit",
            user_id: user.id,
            llm_model: "gpt-4o",
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            public: false,
          })
          .select("*")
          .single();

        if (createError) {
          console.error("Error creating prompt:", createError);
          return;
        }

        // Create entry in graph_prompt_nodes instead of updating graph_nodes
        const { error: promptNodeCreateError } = await supabase
          .from("graph_prompt_nodes")
          .insert({
            graph_node_id: data.id,
            prompt_id: newPrompt.id,
          });

        if (promptNodeCreateError) {
          console.error("Error creating prompt node:", promptNodeCreateError);
          return;
        }

        setPrompt(newPrompt);
      }
    };

    fetchLabel();
  }, [data.id, user]);

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
