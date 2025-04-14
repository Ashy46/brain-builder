"use client";

import { useEffect, useState } from "react";

import { Loader2, Plus } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Tables } from "@/types/supabase";

import { Badge } from "@/components/ui/badge";

import { useGraph } from "../layout";
import { EditStateDialog } from "../dialogs/edit-state-dialog";
import AddStateDialog from "../dialogs/add-state-dialog";
import { Node } from "./base/node";

export function AnalysisNode() {
  const { graphId } = useGraph();

  const [states, setStates] = useState<Tables<"graph_states">[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStates = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_states")
      .select("*")
      .eq("graph_id", graphId)
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Failed to fetch states");
      return;
    }

    setStates(data ?? []);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchStates();
  }, [graphId]);

  return (
    <Node title="Analysis States">
      <AddStateDialog fetchStates={fetchStates} />

      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="size-12 animate-spin p-2" />
        </div>
      ) : (
        states.map((state) => (
          <div
            key={state.id}
            className="flex items-center gap-3 animate-in fade-in"
          >
            <Badge
              variant="default"
              className="text-md w-full justify-center py-1.5 px-6"
            >
              {state.name.charAt(0).toUpperCase() + state.name.slice(1)}
            </Badge>

            <Badge variant="outline" className="text-md py-1.5 px-6">
              {state.type.charAt(0).toUpperCase() +
                state.type.slice(1).toLowerCase()}
            </Badge>

            <EditStateDialog state={state} fetchStates={fetchStates} />
          </div>
        ))
      )}

      <Handle type="source" position={Position.Bottom} />
    </Node>
  );
}
