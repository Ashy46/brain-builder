"use client";

import { useState, useEffect } from "react";

import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface State {
  id: string;
  name: string;
  starting_value: string | null;
  persistent: boolean;
  type: "number" | "text";
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
      // Revert on error
      console.error("Error updating state:", error);
      toast.error("Failed to update state");
      await fetchStates(); // Refresh to get correct state
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>Manage States</DialogTitle>

          <div className="flex gap-2">
            <Input
              className="h-10"
              placeholder="New state name"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createState();
                }
              }}
            />
            <Select
              value={newStateType}
              onValueChange={(value: "number" | "text") =>
                setNewStateType(value)
              }
            >
              <SelectTrigger className="w-[120px] h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-10" onClick={createState}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="space-y-4">
              {states.map((state) => (
                <div
                  key={state.id}
                  className="flex flex-col gap-2 p-4 border rounded-lg"
                >
                  <div className="flex flex-row gap-2">
                    <Input
                      className="h-10"
                      value={state.name}
                      onChange={(e) =>
                        updateState(state.id, { name: e.target.value })
                      }
                    />
                    <span className="text-sm text-gray-500 min-w-[80px]">
                      ({state.type})
                    </span>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => deleteState(state.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-row gap-2">
                    <Input
                      className="h-10"
                      placeholder={`Starting ${
                        state.type === "number" ? "number" : "text"
                      }`}
                      type={state.type === "number" ? "number" : "text"}
                      value={state.starting_value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          state.type === "number" &&
                          value &&
                          isNaN(Number(value))
                        )
                          return;
                        updateState(state.id, {
                          starting_value: value || null,
                        });
                      }}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={state.persistent}
                        onCheckedChange={(checked) =>
                          updateState(state.id, { persistent: checked })
                        }
                      />
                      <Label>Persistent</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
