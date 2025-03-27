import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client/client";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface State {
  id: string;
  name: string;
  type: "number" | "text";
}

export function SelectStatesDialog({
  open,
  onOpenChange,
  graphId,
  selectedStateIds,
  onStatesChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
  selectedStateIds: string[];
  onStatesChange: (stateIds: string[]) => void;
}) {
  const supabase = createClient();
  const [states, setStates] = useState<State[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedStateIds);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open, graphId]);

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .eq("graph_id", graphId);

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateToggle = (stateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId]
    );
  };

  const handleSave = () => {
    onStatesChange(selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select States to Update</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {states.map((state) => (
              <div
                key={state.id}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={state.id}
                  checked={selectedIds.includes(state.id)}
                  onCheckedChange={() => handleStateToggle(state.id)}
                />
                <Label htmlFor={state.id} className="flex items-center gap-2">
                  {state.name}
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {state.type}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 