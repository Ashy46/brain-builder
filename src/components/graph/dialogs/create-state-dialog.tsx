import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CreateStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
  onSuccess?: () => void;
}

export function CreateStateDialog({
  open,
  onOpenChange,
  graphId,
  onSuccess,
}: CreateStateDialogProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [stateType, setStateType] = useState<"TEXT" | "NUMBER" | "BOOLEAN">("TEXT");
  const [startingValue, setStartingValue] = useState("");
  const [persistent, setPersistent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !stateType) return;

    setIsLoading(true);

    try {
      // Create state with the new schema fields
      const { data, error } = await supabase.from("graph_states").insert({
        graph_id: graphId,
        name: name.trim(),
        type: stateType,
        starting_value: startingValue,
        persistent,
        // New schema fields
        analysis_prompt: "",
        analysis_config: {
          model: "gpt-4o-mini",
          temperature: 1.05,
          maxTokens: 256,
          frequencyPenalty: 0.4,
          presencePenalty: 0.4,
          topP: 1,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("State created successfully");
      setName("");
      setStateType("TEXT");
      setStartingValue("");
      setPersistent(true);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating state:", error);
      toast.error("Failed to create state");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New State</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter state name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={stateType}
              onValueChange={(value) => setStateType(value as any)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="NUMBER">Number</SelectItem>
                <SelectItem value="BOOLEAN">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startingValue">Starting Value (optional)</Label>
            <Input
              id="startingValue"
              value={startingValue}
              onChange={(e) => setStartingValue(e.target.value)}
              placeholder={
                stateType === "TEXT"
                  ? "Text value..."
                  : stateType === "NUMBER"
                  ? "0"
                  : "true/false"
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="persistent">Save Between Sessions</Label>
            <Switch
              id="persistent"
              checked={persistent}
              onCheckedChange={setPersistent}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create State"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 