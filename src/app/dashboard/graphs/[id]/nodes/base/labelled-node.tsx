"use client";

import { useEffect, useState } from "react";

import { debounce } from "lodash";

import { createClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";

import { Node } from "./node";

export function LabelledNode({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const fetchLabel = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("graph_nodes")
        .select("label")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching label:", error);
        return;
      }

      setLabel(data.label);
    };

    fetchLabel();
  }, [id]);

  const updateLabel = debounce(async (newLabel: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("graph_nodes")
      .update({ label: newLabel })
      .eq("id", id);

    if (error) {
      console.error("Error updating node label:", error);
    }
  }, 500);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    updateLabel(newLabel);
  };

  return (
    <Node title={title}>
      <Input
        value={label}
        onChange={handleLabelChange}
        className="w-full nodrag"
      />

      {children}
    </Node>
  );
}
