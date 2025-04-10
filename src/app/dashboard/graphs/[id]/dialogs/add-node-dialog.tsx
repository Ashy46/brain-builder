import { useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BrainCircuit, Code2 } from "lucide-react";
import { useGraph } from "../layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const nodeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(["CONDITIONAL", "PROMPT"]),
})

type NodeFormData = z.infer<typeof nodeSchema>;

export default function AddNodeDialog() {
  const [open, setOpen] = useState(false);
  const { graphId } = useGraph();
  const [formData, setFormData] = useState<NodeFormData>({
    label: "",
    type: "CONDITIONAL",
  });

  const handleSubmit = async () => {
    const result = nodeSchema.safeParse(formData);
    if (!result.success) {
      toast.error("Invalid form data");
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_nodes")
      .insert({
        label: formData.label,
        node_type: formData.type,
        graph_id: graphId,
        pos_x: 0,
        pos_y: -100,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      toast.error("Error adding node");
      return;
    }

    toast.success("Node added successfully");
    setOpen(false);
    setFormData({ label: "", type: "CONDITIONAL" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background/50 hover:bg-accent/50 backdrop-blur-md">
          <Plus className="h-4 w-4" />
          Add Node
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
          <DialogDescription>
            Add a new node to the graph.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Label</Label>
            <Input id="label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "CONDITIONAL" })}
                className={`flex-1 p-4 rounded-lg border transition-colors ${formData.type === "CONDITIONAL"
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/40 hover:bg-muted/60"
                  }`}
              >
                <Code2 className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Conditional</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "PROMPT" })}
                className={`flex-1 p-4 rounded-lg border transition-colors ${formData.type === "PROMPT"
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/40 hover:bg-muted/60"
                  }`}
              >
                <BrainCircuit className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Prompt</span>
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}