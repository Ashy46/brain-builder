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

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeLabel: string;
  nodePrompt?: string;
  nodeType: string;
  onLabelChange: (nodeId: string, newLabel: string) => void;
  onPromptChange: (nodeId: string, newData: any) => void;
}

export function EditNodeDialog({
  open,
  onOpenChange,
  nodeId,
  nodeLabel,
  nodePrompt,
  nodeType,
  onLabelChange,
  onPromptChange,
}: EditNodeDialogProps) {
  const [label, setLabel] = useState(nodeLabel);
  const [prompt, setPrompt] = useState(nodePrompt || "");

  const handleSave = () => {
    onLabelChange(nodeId, label);
    if (nodeType !== "Conditional") {
      onPromptChange(nodeId, { prompt });
    }
    onOpenChange(false);
  };

  const handleAIPromptChange = (nodeId: string, newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const showPromptSection = nodeType !== "Conditional";

  return (
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
                <AIPromptFeatures
                  nodeId={nodeId}
                  nodeLabel={label}
                  currentPrompt={prompt}
                  onPromptChange={handleAIPromptChange}
                />
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
  );
} 