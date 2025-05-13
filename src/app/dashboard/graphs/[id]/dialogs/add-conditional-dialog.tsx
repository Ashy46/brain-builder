import { useEffect, useState } from "react";

import { Tables } from "@/types/supabase";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AddConditionalDialog({
  conditionals,
  setConditionals,
  availableStates,
  node_id,
}: {
  conditionals: Tables<"graph_conditional_node_conditions">[];
  setConditionals: (conditionals: any[]) => void;
  availableStates: Tables<"graph_states">[];
  node_id: string;
}) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);

  const onValueChange = async (value: string) => {
    const selectedState = availableStates.find((state) => state.id === value) || null;

    //Grabbing the conditional node id
    const { data: conditionalNode, error: conditionalError } = await supabase
      .from("graph_conditional_nodes")
      .select("id")
      .eq("graph_node_id", node_id)
      .single();

    if (conditionalError) {
      toast.error("Error finding conditional node");
      return;
    }

    //Inserting the conditional
    const { data, error } = await supabase.from("graph_conditional_node_conditions")
      .insert({
        graph_conditional_node_id: conditionalNode.id,
        state_id: selectedState?.id,
      });

    if (error) {
      toast.error(error.message);
    } else {
      if (data) {
        setConditionals([...conditionals, data[0]]);
      }
    }
    setOpen(false);
  }

  useEffect(() => {
    console.log("States", availableStates);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="size-4 mr-2" />
          Add Conditional
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Conditional State</DialogTitle>
          <DialogDescription>
            Select a state to add a conditional to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={(value) => onValueChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {availableStates.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  )
}