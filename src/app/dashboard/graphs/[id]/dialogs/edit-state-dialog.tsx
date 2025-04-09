import { useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { Tables } from "@/types/supabase";

import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const stateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["NUMBER", "TEXT", "BOOLEAN"]),
  persistent: z.boolean(),
  starting_value: z.string().nullable(),
});

type StateFormData = z.infer<typeof stateSchema>;

export function EditStateDialog({
  state,
  fetchStates,
}: {
  state: Tables<"graph_states">;
  fetchStates: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<StateFormData>({
    name: state.name,
    type: state.type,
    persistent: state.persistent,
    starting_value: state.starting_value,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const validatedData = stateSchema.parse(formData);

      const supabase = createClient();

      const { error } = await supabase
        .from("graph_states")
        .update({
          name: validatedData.name,
          type: validatedData.type,
          persistent: validatedData.persistent,
          starting_value: validatedData.starting_value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.id);

      if (error) throw error;

      toast.success("State updated successfully");
      setOpen(false);
      fetchStates();
    } catch (error) {
      console.error("Error updating state:", error);
      toast.error("Failed to update state");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit State</DialogTitle>
          <DialogDescription>Edit the state of the graph.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "NUMBER" | "TEXT" | "BOOLEAN") =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NUMBER">Number</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="BOOLEAN">Boolean</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="persistent"
                checked={formData.persistent}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, persistent: checked }))
                }
              />
              <Label htmlFor="persistent">Persistent</Label>
            </div>

            <Label>Starting Value</Label>
            <Input
              type={formData.type === "NUMBER" ? "number" : "text"}
              value={formData.starting_value || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  starting_value: e.target.value || null,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
