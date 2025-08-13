import { useEffect, useState } from "react";

import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BrainCircuit, Code2 } from "lucide-react";

import { useGraph } from "../context/graph-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";
import { useAuth } from "@/lib/hooks/use-auth";

const nodeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(["CONDITIONAL", "PROMPT"]),
})

type NodeFormData = z.infer<typeof nodeSchema>;

export default function AddNodeDialog() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const { graphId } = useGraph();
  const [formData, setFormData] = useState<NodeFormData>({
    label: "",
    type: "CONDITIONAL",
  });
  const [prompts, setPrompts] = useState<Tables<"user_prompts">[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Tables<"user_prompts"> | null>(null);

  const { refresh, setRefresh } = useGraph();

  const fetchPrompts = async () => {
    console.log("FETCHING");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_prompts")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("GAYYY");
      toast.error("Error fetching prompts");
      return;
    }

    const filteredData = data.filter(prompt => prompt.description !== "Default prompt");
    console.log("FILTERED PROMPTS DATA", filteredData);
    setPrompts(filteredData);
  }

  useEffect(() => {
    if (!user) return;
    fetchPrompts();

  }, [user]);

  // Reset selectedPrompt when switching to CONDITIONAL type
  useEffect(() => {
    if (formData.type === "CONDITIONAL") {
      setSelectedPrompt(null);
    }
  }, [formData.type]);

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

    if (formData.type === "PROMPT") {
      let promptId = selectedPrompt?.id;
      if (!selectedPrompt) {
        const { data: promptData, error: promptError } = await supabase
          .from("user_prompts")
          .insert({
            description: "Default prompt",
            content: "Hey, this is a test prompt. Edit this to your fit",
            user_id: user?.id,
          })
          .select("*")
          .maybeSingle();

        if (promptError) {
          toast.error("Error adding default prompt");
          return;
        }
        promptId = promptData?.id;
      }
      const { data: promptData, error: promptError } = await supabase
        .from("graph_prompt_nodes")
        .insert({
          graph_node_id: data.id,
          prompt_id: promptId,
        })

      if (promptError) {
        toast.error("Error adding prompt");
        return;
      }

      toast.success("Prompt added successfully");
    } else if (formData.type === "CONDITIONAL") {
      const { data: conditionalData, error: conditionalError } = await supabase
        .from("graph_conditional_nodes")
        .insert({
          graph_node_id: data.id,
        })
        .select();

      if (conditionalError) {
        toast.error("Error adding conditional node");
        console.error("Error adding conditional node:", conditionalError);
        return;
      }

      setSelectedPrompt(null);

      console.log("Created conditional node:", conditionalData);
      toast.success("Conditional node added successfully");
    }

    toast.success("Node added successfully");
    setOpen(false);
    setFormData({ label: "", type: "CONDITIONAL" });
    setSelectedPrompt(null);
    setRefresh(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => fetchPrompts()} className="bg-background/50 hover:bg-accent/50 backdrop-blur-md">
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
            <div className="gap-2">
              {formData.type === "PROMPT" && (
                <div className="grid gap-2 py-4">
                  <Label>Select Prompt</Label>
                  <Select
                    value={selectedPrompt?.id}
                    onValueChange={(value) => {
                      // If clicking on the same prompt, deselect it
                      if (selectedPrompt?.id === value) {
                        setSelectedPrompt(null);
                        return;
                      }
                      const prompt = prompts.find(p => p.id === value);
                      setSelectedPrompt(prompt || null);
                    }}
                  >
                    <SelectTrigger onClick={() => setSelectedPrompt(null)}>
                      <SelectValue placeholder="Select a prompt" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start">
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.description || "Untitled Prompt"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}