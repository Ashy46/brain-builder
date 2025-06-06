"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { debounce } from "lodash";

import { createClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";

import { useGraph } from "../../layout";
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
  const { refresh, setRefresh } = useGraph();

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

  const deleteNode = async () => {
    const supabase = createClient();

    console.log("Deleting node:", id);

    const { data, error } = await supabase
      .from("graph_nodes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting node:", error);
    }

    console.log("Node deleted:", data);
    toast.success("Node deleted successfully");
    setRefresh(true);
  }

  return (
    <Node title={title} deleteNode={deleteNode}>
      <Input
        value={label}
        onChange={handleLabelChange}
        className="w-full nodrag"
      />

      {children}
    </Node>
  );
}
