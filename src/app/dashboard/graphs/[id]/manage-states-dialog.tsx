"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface State {
  id: string;
  name: string;
  starting_value: string | null;
  persistent: boolean;
  type: "number" | "text";
}

function EditStateDialog({
  state,
  onClose,
  onUpdate,
  onDelete,
}: {
  state: State;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<State>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit State</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2">Name</Label>
            <Input
              value={state.name}
              onChange={(e) => onUpdate(state.id, { name: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-2">Starting Value</Label>
            <Input
              placeholder={`Starting ${
                state.type === "number" ? "number" : "text"
              }`}
              type={state.type === "number" ? "number" : "text"}
              value={state.starting_value || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (state.type === "number" && value && isNaN(Number(value)))
                  return;
                onUpdate(state.id, { starting_value: value || null });
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Persistence</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={state.persistent}
                onCheckedChange={(checked) =>
                  onUpdate(state.id, { persistent: checked })
                }
              />
              <span className="text-sm text-muted-foreground">
                Keep state between sessions
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(state.id);
                onClose();
              }}
            >
              Delete State
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManageStatesDialog({
  open,
  onOpenChange,
  graphId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
}) {
  const { user } = useAuth();
  const supabase = createClient();

  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStateName, setNewStateName] = useState("");
  const [newStateType, setNewStateType] = useState<"number" | "text">("text");
  const [editingState, setEditingState] = useState<State | null>(null);

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

  const createState = async () => {
    if (!newStateName.trim()) {
      toast.error("State name is required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("states")
        .insert({
          name: newStateName.trim(),
          graph_id: graphId,
          starting_value: null,
          persistent: false,
          type: newStateType,
        })
        .select()
        .single();

      if (error) throw error;

      const newState = data;
      setStates((prev) => [...prev, newState]);
      setNewStateName("");
      setNewStateType("text");
      toast.success("State created successfully");
    } catch (error) {
      console.error("Error creating state:", error);
      toast.error("Failed to create state");
    }
  };

  const updateState = async (stateId: string, updates: Partial<State>) => {
    setStates(
      states.map((state) =>
        state.id === stateId ? { ...state, ...updates } : state
      )
    );

    try {
      const { error } = await supabase
        .from("states")
        .update(updates)
        .eq("id", stateId);

      if (error) throw error;
      toast.success("State updated successfully");
    } catch (error) {
      console.error("Error updating state:", error);
      toast.error("Failed to update state");
      await fetchStates();
    }
  };

  const deleteState = async (stateId: string) => {
    setStates(states.filter((state) => state.id !== stateId));

    try {
      const { error } = await supabase
        .from("states")
        .delete()
        .eq("id", stateId);

      if (error) throw error;
      toast.success("State deleted successfully");
    } catch (error) {
      console.error("Error deleting state:", error);
      toast.error("Failed to delete state");
      await fetchStates();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage States</DialogTitle>
            <div className="flex gap-2">
              <Input
                placeholder="New state name"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createState();
                  }
                }}
                className="h-10"
              />
              <Select
                value={newStateType}
                onValueChange={(value: "number" | "text") =>
                  setNewStateType(value)
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createState} className="h-10">
                <Plus className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                states.map((state) => (
                  <div
                    key={state.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{state.name}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          state.type === "number"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        )}
                      >
                        {state.type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingState(state)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {editingState && (
        <EditStateDialog
          state={editingState}
          onClose={() => setEditingState(null)}
          onUpdate={updateState}
          onDelete={deleteState}
        />
      )}
    </>
  );
}
