import { useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { useGraph } from "../layout";
const stateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["NUMBER", "TEXT", "BOOLEAN"]),
  persistent: z.boolean(),
  starting_value: z.string().nullable(),
});

type StateFormData = z.infer<typeof stateSchema>;

export default function AddStateDialog({ fetchStates }: { fetchStates: () => void }) {
  const { graphId } = useGraph();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<StateFormData>({
    name: "",
    type: "NUMBER",
    persistent: false,
    starting_value: null,
  });

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to add a state");
      return;
    }

    const result = stateSchema.safeParse(formData);
    if (!result.success) {
      toast.error("Invalid form data");
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_states")
      .insert({
        name: formData.name,
        type: formData.type,
        persistent: formData.persistent,
        starting_value: formData.starting_value,
        created_at: new Date(),
        graph_id: graphId,
        updated_at: new Date(),
      });

    if (error) {
      toast.error("Error adding state");
      return;
    }

    toast.success("State added successfully");
    setOpen(false);
    fetchStates?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mb-4">
          <Plus className="size-4" />
          Add State
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add State</DialogTitle>
          <DialogDescription>
            Add a new state to the graph.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
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
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={() => handleSubmit()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}