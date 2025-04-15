"use client";

import { useEffect } from "react";
import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { PencilIcon, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import { LabelledNode } from "./base/labelled-node";
import { EditConditionalDialog } from "../dialogs/edit-conditional-dialog";

export function ConditionalNode({ data }: { data: any }) {

  useEffect(() => {
    if (!data.id) return;

    const checkAndCreateConditionalNode = async () => {
      const supabase = createClient();

      // Check if the conditional node exists
      const { data: conditionalNodeData, error: conditionalNodeError } = await supabase
        .from("graph_conditional_nodes")
        .select("*")
        .eq("graph_node_id", data.id)
        .maybeSingle();

      if (conditionalNodeError) {
        console.error("Error checking conditional node:", conditionalNodeError);
        return;
      }

      // If it doesn't exist, create it
      if (!conditionalNodeData) {
        console.log("No conditional node found, creating one:", data.id);
        const { data: newConditionalNode, error: createError } = await supabase
          .from("graph_conditional_nodes")
          .insert({
            graph_node_id: data.id,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating conditional node:", createError);
          toast.error("Error setting up conditional node");
          return;
        }

        console.log("Created conditional node:", newConditionalNode);
      } else {
        console.log("Existing conditional node:", conditionalNodeData);
      }
    };

    checkAndCreateConditionalNode();
  }, [data.id]);

  return (
    <LabelledNode id={data.id} title="Conditional">
      <Handle type="target" position={Position.Top} />

      <EditConditionalDialog node_id={data.id} />

      <div className="flex justify-between items-center px-17 py-1">
        <div className="flex items-center gap-1">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-500 text-sm">False</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: "33%" }}
          />
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-green-500 text-sm">True</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: "66%" }}
          />
        </div>
      </div>
    </LabelledNode>
  );
}
