import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NodeType } from "./nodes";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (type: NodeType, label: string) => void;
  isRootNode: boolean;
}

export function AddNodeDialog({
  open,
  onOpenChange,
  onAddNode,
  isRootNode,
}: AddNodeDialogProps) {
  const [label, setLabel] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType>("analysis");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAddNode(selectedType, label.trim());
    setLabel("");
    onOpenChange(false);
  };

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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedType === "conditional" ? "default" : "outline"}
                  onClick={() => setSelectedType("conditional")}
                >
                  Conditional
                </Button>
                <Button
                  type="button"
                  variant={selectedType === "prompt" ? "default" : "outline"}
                  onClick={() => setSelectedType("prompt")}
                >
                  Prompt
                </Button>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full">
            Add Node
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 