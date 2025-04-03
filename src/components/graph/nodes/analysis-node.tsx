import { Handle, Position } from "@xyflow/react";
import { useState, useEffect } from "react";
import { ArrowLeftRight, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/tailwind";
import { createClient } from "@/lib/supabase/client";
import { useStatePromptData } from "@/components/graph/hooks";

import { SelectStatesDialog } from "@/components/graph/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NodePropsWithData, AnalysisNodeData } from "./types";
import { EditNodeDialog } from "@/components/graph/dialogs/edit-node-dialog";

interface State {
  id: string;
  name: string;
  type: "number" | "text";
}

function NodeTypeLabel({ type }: { type: string }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-2 px-3 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function AnalysisNode({
  data,
  isConnectable,
  selected,
  id,
}: NodePropsWithData) {
  const [isSelectingStates, setIsSelectingStates] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const analysisData = data as AnalysisNodeData;
  const { updateStatePrompt } = useStatePromptData(analysisData.graphId);
  const selectedStates = analysisData.selectedStates || [];
  const statePrompts = analysisData.statePrompts || [];

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const { data: statesData, error } = await supabase
          .from("graph_states")
          .select("*")
          .eq("graph_id", analysisData.graphId)
          .in("id", selectedStates);

        if (error) throw error;
        setStates(statesData || []);
      } catch (error) {
        console.error("Error fetching states:", error);
        toast.error("Failed to load states");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedStates.length > 0) {
      fetchStates();
    } else {
      setIsLoading(false);
    }
  }, [analysisData.graphId, selectedStates, supabase]);

  const handleStatesChange = (stateIds: string[]) => {
    try {
      analysisData.onStatesChange?.(id, stateIds);
      toast.success("States updated");
    } catch (error) {
      console.error("Error updating states:", error);
      toast.error("Failed to update states");
    }
  };

  const handleStatePromptChange = async (
    stateId: string,
    prompt: string,
    llmConfig?: any
  ) => {
    try {
      const success = await updateStatePrompt(stateId, prompt, llmConfig);
      if (success) {
        toast.success("Prompt saved successfully");
      }
    } catch (error) {
      console.error("Error saving state prompt:", error);
      toast.error("Failed to save prompt");
      throw error;
    }
  };

  const editingState = states.find((s) => s.id === editingStateId);
  const editingStatePrompt = statePrompts.find(
    (sp) => sp.stateId === editingStateId
  );

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-blue-500/20",
          selected && "border-2 border-blue-400/50"
        )}
        style={{ width: "220px" }}
      >
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectingStates(true)}
            className="h-7 mb-2"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Manage States
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading states...
            </div>
          ) : states.length > 0 ? (
            states.map((state) => {
              const hasPrompt = statePrompts.some(
                (sp) => sp.stateId === state.id && typeof sp.prompt === 'string' && sp.prompt.trim().length > 0
              );

              return (
                <Badge
                  key={state.id}
                  variant={hasPrompt ? "default" : "secondary"}
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => setEditingStateId(state.id)}
                >
                  {state.name}
                  <span className="px-1 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {state.type}
                  </span>
                  <Pencil className="h-3 w-3 ml-1" />
                </Badge>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground">
              No states selected
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>

      <SelectStatesDialog
        open={isSelectingStates}
        onOpenChange={setIsSelectingStates}
        graphId={analysisData.graphId}
        selectedStateIds={selectedStates}
        onStatesChange={handleStatesChange}
      />

      {editingStateId && editingState && (
        <EditNodeDialog
          open={!!editingStateId}
          onOpenChange={(open) => !open && setEditingStateId(null)}
          mode="state"
          nodeId={id}
          stateId={editingStateId}
          stateName={editingState.name}
          stateType={editingState.type}
          prompt={editingStatePrompt?.prompt || ""}
          llmConfig={editingStatePrompt?.llmConfig}
          onPromptChange={handleStatePromptChange}
        />
      )}
    </div>
  );
}
