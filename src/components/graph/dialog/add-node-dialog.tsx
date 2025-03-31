import { useState, useEffect } from "react";

import { Brain, GitBranch, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { NodeType } from "./nodes";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (type: NodeType, label: string) => void;
  isRootNode: boolean;
  hasAnalysisNode: boolean;
}

export function AddNodeDialog({
  open,
  onOpenChange,
  onAddNode,
  isRootNode,
  hasAnalysisNode,
}: AddNodeDialogProps) {
  const [label, setLabel] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(
    isRootNode ? "analysis" : null
  );

  useEffect(() => {
    if (open) {
      setSelectedType(isRootNode ? "analysis" : null);
      setLabel("");
    }
  }, [open, isRootNode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || (!isRootNode && !selectedType)) return;
    onAddNode(isRootNode ? "analysis" : selectedType!, label.trim());
    setLabel("");
    onOpenChange(false);
  };

  const nodeTypes = [
    {
      type: "analysis" as NodeType,
      label: "Analysis",
      icon: Brain,
      disabled: hasAnalysisNode,
    },
    {
      type: "conditional" as NodeType,
      label: "Conditional",
      icon: GitBranch,
      disabled: false,
    },
    {
      type: "prompt" as NodeType,
      label: "Prompt",
      icon: MessageSquare,
      disabled: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Node Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter node label"
            />
          </div>
          {!isRootNode && (
            <div className="space-y-2">
              <Label>Node Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {nodeTypes.map(({ type, label, icon: Icon, disabled }) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedType === type ? "default" : "outline"}
                    onClick={() => setSelectedType(type)}
                    disabled={disabled}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={!label.trim() || (!isRootNode && !selectedType)}
          >
            Add Node
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
