"use client";

import { useEffect, useState } from "react";

import { Loader2, Pencil, Plus } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Tables } from "@/types/supabase";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useGraph } from "../layout";

export function AnalysisNode() {
  const { graphId } = useGraph();

  const [states, setStates] = useState<Tables<"graph_states">[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStates = async () => {
      setIsLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("graph_states")
        .select("*")
        .eq("graph_id", graphId);

      if (error) {
        console.error(error);
        toast.error("Failed to fetch states");
        return;
      }

      setStates(data ?? []);

      setIsLoading(false);
    };
    fetchStates();
  }, [graphId]);

  return (
    <>
      <span className="text-sm text-foreground/50 text-center font-medium block mb-1">
        Analysis
      </span>

      <div className="rounded-2xl bg-muted/50 border backdrop-blur-md p-4 space-y-3 min-w-[340px]">
        <Button variant="outline" className="w-full mb-4">
          Add State <Plus className="size-4" />
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="size-12 animate-spin p-2" />
          </div>
        ) : (
          states.map((state) => (
            <div key={state.id} className="flex items-center gap-3">
              <div className="flex flex-1">
                <Badge variant="default" className="text-md py-1.5 px-6">
                  {state.name.charAt(0).toUpperCase() + state.name.slice(1)}
                </Badge>
              </div>

              <Badge variant="outline" className="text-md py-1.5 px-6">
                {state.type.charAt(0).toUpperCase() +
                  state.type.slice(1).toLowerCase()}
              </Badge>

              <Button variant="outline" size="icon">
                <Pencil className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="analysis-node-output"
      />
    </>
  );
}
