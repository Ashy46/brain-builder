import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

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

const STATES_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(0);

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

  const totalPages = Math.ceil(states.length / STATES_PER_PAGE);
  const paginatedStates = states.slice(
    currentPage * STATES_PER_PAGE,
    (currentPage + 1) * STATES_PER_PAGE
  );

  const dialogHeight = states.length <= 1 ? "auto" : 
                      states.length <= 5 ? `${Math.min(states.length * 60 + 120, 300)}px` : 
                      "400px";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" style={{ minHeight: dialogHeight }}>
        <DialogHeader>
          <DialogTitle>Select States to Update</DialogTitle>
        </DialogHeader>

        <ScrollArea className={states.length > 1 ? "h-[300px] pr-4" : "pr-4"}>
          <div className="space-y-4">
            {paginatedStates.map((state) => (
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

        <div className="flex justify-between items-center mt-4">
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 