import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AIPromptFeatures } from "../nodes/ai-prompt-features";
import { ModelSettingsDialog } from "./model-settings-dialog";
import { Settings2 } from "lucide-react";
import { LLMConfig } from "../nodes/types";

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeLabel: string;
  nodePrompt?: string;
  nodeType: string;
  llmConfig?: LLMConfig;
  onLabelChange: (nodeId: string, newLabel: string) => void;
  onPromptChange: (nodeId: string, newData: any) => void;
  onLLMConfigChange?: (nodeId: string, config: LLMConfig) => void;
}

export function EditNodeDialog({
  open,
  onOpenChange,
  nodeId,
  nodeLabel,
  nodePrompt,
  nodeType,
  llmConfig: initialLLMConfig,
  onLabelChange,
  onPromptChange,
  onLLMConfigChange,
}: EditNodeDialogProps) {
  const [label, setLabel] = useState(nodeLabel);
  const [prompt, setPrompt] = useState(nodePrompt || "");
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => ({
    model: initialLLMConfig?.model || "gpt-4o-mini",
    temperature: initialLLMConfig?.temperature || 1.05,
    maxTokens: initialLLMConfig?.maxTokens || 256,
    frequencyPenalty: initialLLMConfig?.frequencyPenalty || 0.4,
    presencePenalty: initialLLMConfig?.presencePenalty || 0.4,
    topP: initialLLMConfig?.topP || 1,
  }));

  const handleSave = () => {
    onLabelChange(nodeId, label);
    if (nodeType !== "Conditional") {
      onPromptChange(nodeId, { prompt, llmConfig });
      if (onLLMConfigChange) {
        onLLMConfigChange(nodeId, llmConfig);
      }
    }
    onOpenChange(false);
  };

  const handleAIPromptChange = (nodeId: string, newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const showPromptSection = nodeType !== "Conditional";
  const showLLMConfig = nodeType === "Prompt" || nodeType === "Analysis";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit {nodeType} Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter node label..."
              />
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
                  className="min-h-[200px] resize-none"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLLMConfig && (
        <ModelSettingsDialog
          open={isModelSettingsOpen}
          onOpenChange={setIsModelSettingsOpen}
          config={llmConfig}
          onConfigChange={setLLMConfig}
        />
      )}
    </>
  );
} 