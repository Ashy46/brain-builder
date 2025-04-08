"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Settings2 } from "lucide-react";

import { toast } from "sonner";

import { cn } from "@/lib/utils/tailwind";
import { createClient } from "@/lib/supabase/client";

import { Enums, Tables } from "@/types/supabase";

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

function EditStateDialog({
  state,
  onClose,
  onUpdate,
  onDelete,
}: {
  state: Tables<"graph_states">;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Tables<"graph_states">>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(state.name);
  const [startingValue, setStartingValue] = useState(
    state.starting_value || ""
  );
  const [isPersistent, setIsPersistent] = useState(state.persistent);

  const handleUpdate = (updates: Partial<Tables<"graph_states">>) => {
    onUpdate(state.id, updates);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit State</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              className="h-10 mt-2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleUpdate({ name: e.target.value });
              }}
            />
          </div>

          <div>
            <Label>Starting Value</Label>
            <Input
              className="h-10 mt-2"
              placeholder={`Starting ${state.type}`}
              type={state.type}
              value={startingValue}
              onChange={(e) => {
                const value = e.target.value;
                if (state.type === "NUMBER" && value && isNaN(Number(value)))
                  return;
                setStartingValue(value);
                handleUpdate({ starting_value: value || null });
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Persistence</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPersistent}
                onCheckedChange={(checked) => {
                  setIsPersistent(checked);
                  handleUpdate({ persistent: checked });
                }}
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
  const [states, setStates] = useState<Tables<"graph_states">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStateName, setNewStateName] = useState("");
  const [newStateType, setNewStateType] =
    useState<Enums<"state_type">>("NUMBER");
  const [editingState, setEditingState] =
    useState<Tables<"graph_states"> | null>(null);

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open, graphId]);

  const fetchStates = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_states")
      .select("*")
      .eq("graph_id", graphId);

    if (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to fetch states");
      return;
    }

    setStates(data || []);

    setIsLoading(false);
  };

  const createState = async () => {
    if (!newStateName.trim()) {
      toast.error("State name is required");
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_states")
      .insert({
        name: newStateName.trim(),
        graph_id: graphId,
        starting_value: null,
        persistent: false,
        type: newStateType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating state:", error);
      toast.error("Failed to create state");
      return;
    }

    setStates((prev) => [...prev, data]);
    toast.success("State created successfully");

    setNewStateName("");
    setNewStateType("NUMBER");
  };

  const updateState = async (
    stateId: string,
    updates: Partial<Tables<"graph_states">>
  ) => {
    setStates(
      states.map((state) =>
        state.id === stateId ? { ...state, ...updates } : state
      )
    );

    const supabase = createClient();

    const { error } = await supabase
      .from("graph_states")
      .update(updates)
      .eq("id", stateId);

    if (error) {
      console.error("Error updating state:", error);
      toast.error("Failed to update state");
      return;
    }

    toast.success("State updated successfully");
  };

  const deleteState = async (stateId: string) => {
    setStates(states.filter((state) => state.id !== stateId));

    const supabase = createClient();

    const { error } = await supabase
      .from("graph_states")
      .delete()
      .eq("id", stateId);

    if (error) {
      console.error("Error deleting state:", error);
      toast.error("Failed to delete state");
      return;
    }

    toast.success("State deleted successfully");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="mb-2">Manage States</DialogTitle>
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
                onValueChange={(value: Enums<"state_type">) =>
                  setNewStateType(value)
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="BOOLEAN">Boolean</SelectItem>
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
                          state.type === "NUMBER"
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
