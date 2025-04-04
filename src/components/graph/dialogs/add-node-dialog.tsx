import { useState, useEffect } from "react";
import { GitBranch, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { NodeType } from "../nodes/types";

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
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setLabel("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    
    if (!selectedType) {
      toast.error("Please select a node type");
      return;
    }
    
    // Log the node creation attempt for debugging
    console.log(`Creating node: type=${selectedType}, label=${label.trim()}`);
    
    try {
      onAddNode(selectedType, label.trim());
      setLabel("");
      onOpenChange(false);
      toast.success(`Created "${label.trim()}" node`, {
        description: `Node type: ${selectedType}`
      });
    } catch (error) {
      console.error("Error creating node:", error);
      toast.error("Failed to create node", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const nodeTypes = [
    {
      type: "conditional" as NodeType,
      label: "Conditional",
      icon: GitBranch,
      disabled: false,
      description: "A node that can branch based on state conditions",
    },
    {
      type: "prompt" as NodeType,
      label: "Prompt",
      icon: MessageSquare,
      disabled: false,
      description: "A node that processes prompts with AI",
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
          <div className="space-y-2">
            <Label>Node Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map(({ type, label, icon: Icon, disabled, description }) => (
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
                  <span className="text-[10px] text-muted-foreground text-center">{description}</span>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <div className="text-xs text-muted-foreground mb-2 w-full">
              Available node types: "prompt", "conditional"
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!label.trim() || !selectedType}
            >
              Add Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
