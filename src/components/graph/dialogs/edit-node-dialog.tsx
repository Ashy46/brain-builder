import { useState, useEffect } from "react";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AIPromptFeatures } from "../nodes/ai-prompt-features";
import { ModelSettingsDialog } from "./model-settings-dialog";
import { LLMConfig } from "../nodes/types";

type EditMode = "node" | "state";

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EditMode;
  // Node props
  nodeId: string;
  nodeLabel?: string;
  nodePrompt?: string;
  nodeType?: string;
  // State props
  stateId?: string;
  stateName?: string;
  stateType?: "number" | "text";
  // Common props
  prompt?: string;
  llmConfig?: LLMConfig;
  // Callbacks
  onLabelChange?: (nodeId: string, newLabel: string) => void;
  onPromptChange: (id: string, ...args: any[]) => void;
  onLLMConfigChange?: (nodeId: string, config: LLMConfig) => void;
}

export function EditNodeDialog({
  open,
  onOpenChange,
  mode,
  // Node props
  nodeId,
  nodeLabel,
  nodePrompt,
  nodeType,
  // State props
  stateId,
  stateName,
  stateType,
  // Common props
  prompt: initialPrompt,
  llmConfig: initialLLMConfig,
  // Callbacks
  onLabelChange,
  onPromptChange,
  onLLMConfigChange,
}: EditNodeDialogProps) {
  const [label, setLabel] = useState(nodeLabel || "");
  const [prompt, setPrompt] = useState(initialPrompt || nodePrompt || "");
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => ({
    model: initialLLMConfig?.model || "gpt-4o-mini",
    temperature: initialLLMConfig?.temperature || 1.05,
    maxTokens: initialLLMConfig?.maxTokens || 256,
    frequencyPenalty: initialLLMConfig?.frequencyPenalty || 0.4,
    presencePenalty: initialLLMConfig?.presencePenalty || 0.4,
    topP: initialLLMConfig?.topP || 1,
  }));

  // Fetch state data when dialog opens
  useEffect(() => {
    const fetchStateData = async () => {
      if (!open || mode !== "state" || !stateId) return;

      try {
        setIsLoading(true);
        const { data: stateData, error } = await supabase
          .from("graph_states")
          .select("data")
          .eq("id", stateId)
          .single();

        if (error) throw error;

        if (stateData?.data) {
          setPrompt(stateData.data.prompt || "");
          setLLMConfig(stateData.data.llmConfig || {
            model: "gpt-4o-mini",
            temperature: 1.05,
            maxTokens: 256,
            frequencyPenalty: 0.4,
            presencePenalty: 0.4,
            topP: 1,
          });
        }
      } catch (error) {
        console.error("Error fetching state data:", error);
        toast.error("Failed to load state data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStateData();
  }, [open, mode, stateId, supabase]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Log the data being saved
      console.log(
        `Saving ${mode} data for ${mode === "node" ? nodeId : stateId}:`,
        {
          label,
          prompt,
          llmConfig,
        }
      );

      // Label is required only for nodes, not for states
      if (mode === "node" && !label.trim()) {
        toast.error("Label is required", {
          description: "Please enter a label for the node.",
          duration: 4000,
        });
        return;
      }

      // Update label if changed and in node mode
      if (mode === "node" && label !== nodeLabel && onLabelChange) {
        await onLabelChange(nodeId, label);
        toast.success("Node label updated", {
          description: "The node label has been changed.",
          duration: 4000,
        });
      }

      // Update prompt and config
      if (mode === "node") {
        await onPromptChange(nodeId, { prompt, llmConfig });
      } else if (mode === "state" && stateId) {
        await onPromptChange(stateId, prompt, llmConfig);
      }

      toast.success(
        mode === "state"
          ? `Successfully saved analysis for "${stateName}"`
          : "Node prompt updated",
        {
          description: "Your prompt and model settings have been saved.",
          duration: 4000,
        }
      );

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error(`Error saving ${mode} data:`, error);
      toast.error("Failed to save changes", {
        description:
          "Please try again. If the problem persists, check the console for details.",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIPromptChange = (nodeId: string, newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const showPromptSection = mode === "state" || nodeType !== "Conditional";
  const showLLMConfig =
    mode === "state" || nodeType === "Prompt" || nodeType === "Analysis";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {mode === "node"
                ? "Edit Prompt"
                : `Edit Analysis for ${stateName}`}
              {mode === "state" && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {stateType}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading state data...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Enter node label..."
                    required
                    disabled={mode === "state"}
                    className={
                      mode === "state" ? "opacity-50 cursor-not-allowed" : ""
                    }
                  />
                  {mode === "state" && (
                    <p className="text-xs text-muted-foreground">
                      Labels cannot be edited for state nodes
                    </p>
                  )}
                </div>
                {showPromptSection && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Prompt</label>
                      <div className="flex gap-2">
                        {showLLMConfig && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModelSettingsOpen(true)}
                          >
                            <Settings2 className="mr-2 h-4 w-4" />
                            Configure Model
                          </Button>
                        )}
                        <AIPromptFeatures
                          nodeId={nodeId}
                          nodeLabel={label}
                          currentPrompt={prompt}
                          onPromptChange={handleAIPromptChange}
                        />
                      </div>
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your prompt here..."
                      className="h-[200px] overflow-y-auto resize-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLLMConfig && (
        <ModelSettingsDialog
          open={isModelSettingsOpen}
          onOpenChange={setIsModelSettingsOpen}
          config={llmConfig}
          onConfigChange={(config) => {
            if (onPromptChange) {
              onPromptChange(nodeId, {
                type: "prompt",
                label: label,
                graphId: "",
                prompt: prompt,
                llmConfig: {
                  model: config.model,
                  temperature: config.temperature,
                  maxTokens: config.maxTokens,
                  frequencyPenalty: config.frequencyPenalty,
                  presencePenalty: config.presencePenalty,
                  topP: config.topP
                }
              });
            }
            setLLMConfig(config);
          }}
        />
      )}
    </>
  );
}
