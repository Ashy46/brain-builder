"use client";

import { useEffect, useState } from "react";

import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { debounce } from "lodash";

import { createClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";

export function PromptNode({ data }: { data: any }) {
  const [label, setLabel] = useState(data.label);

  useEffect(() => {
    setLabel(data.label);
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
        <Input
          value={label}
          onChange={handleLabelChange}
          className="w-full nodrag"
        />
      </span>
    </div>
  );
}
