"use client";

import { useState, useEffect } from "react";
import { GitBranch, MessageSquare, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { NodeType } from "@/components/graph/nodes";
import { cn } from "@/lib/utils/tailwind";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface State {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN";
}

interface Prompt {
  id: string;
  description: string;
  content: string;
}

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (type: NodeType, label: string, config?: any) => void;
  graphId: string;
  isRootNode?: boolean;
}

export function AddNodeDialog({
  open,
  onOpenChange,
  onAddNode,
  graphId,
  isRootNode = false,
}: AddNodeDialogProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [nodeType, setNodeType] = useState<"conditional" | "prompt">("prompt");
  const [states, setStates] = useState<State[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [conditionValue, setConditionValue] = useState<string>("");
  const [conditionOperator, setConditionOperator] = useState<string>("equals");

  useEffect(() => {
    if (open) {
      fetchStates();
      fetchPrompts();
      resetForm();
    }
  }, [open, graphId]);

  const resetForm = () => {
    setLabel("");
    setNodeType("prompt");
    setSelectedStateId("");
    setSelectedPromptId("");
    setConditionValue("");
    setConditionOperator("equals");
  };

  const fetchStates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("graph_states")
        .select("id, name, type")
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

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_prompts")
        .select("id, description, content")
        .eq("user_id", user?.id || "");

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  const getOperatorsForType = (stateType: string) => {
    if (stateType === "NUMBER") {
      return [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
        { value: "greaterThan", label: "Greater Than" },
        { value: "greaterThanOrEqual", label: "Greater Than or Equal To" },
        { value: "lessThan", label: "Less Than" },
        { value: "lessThanOrEqual", label: "Less Than or Equal To" },
      ];
    } else if (stateType === "BOOLEAN") {
      return [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
      ];
    } else {
      return [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
        { value: "notContains", label: "Not Contains" },
      ];
    }
  };

  const handleSubmit = () => {
    if (!label.trim()) {
      toast.error("Node label is required");
      return;
    }

    try {
      if (nodeType === "conditional") {
        if (!selectedStateId) {
          toast.error("Please select a state for the condition");
          return;
        }

        const config = {
          stateId: selectedStateId,
          operator: conditionOperator,
          value: conditionValue,
          stateName: states.find((s) => s.id === selectedStateId)?.name || "",
        };

        onAddNode("conditional", label.trim(), config);
      } else {
        if (!selectedPromptId) {
          toast.error("Please select a prompt");
          return;
        }

        const config = {
          promptId: selectedPromptId,
          promptDescription:
            prompts.find((p) => p.id === selectedPromptId)?.description || "",
        };

        onAddNode("prompt", label.trim(), config);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding node:", error);
      toast.error("Failed to add node");
    }
  };

  const selectedState = states.find((s) => s.id === selectedStateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Node Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter a label for the node"
                className="h-10"
              />
            </div>

            <Tabs
              defaultValue="prompt"
              value={nodeType}
              onValueChange={(value) =>
                setNodeType(value as "conditional" | "prompt")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prompt" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Prompt Node
                </TabsTrigger>
                <TabsTrigger
                  value="conditional"
                  className="flex items-center gap-2"
                >
                  <GitBranch className="h-4 w-4" />
                  Conditional Node
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Select Prompt</Label>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : prompts.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No prompts found. Please create a prompt first.
                    </div>
                  ) : (
                    <Select
                      value={selectedPromptId}
                      onValueChange={setSelectedPromptId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {prompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedPromptId && (
                  <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                    <Label>Selected Prompt</Label>
                    <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.find((p) => p.id === selectedPromptId)?.content ||
                        ""}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="conditional" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : states.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No states found. Please create a state first.
                    </div>
                  ) : (
                    <Select
                      value={selectedStateId}
                      onValueChange={setSelectedStateId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            <div className="flex items-center gap-2">
                              <span>{state.name}</span>
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
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedStateId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="operator">Condition Operator</Label>
                      <Select
                        value={conditionOperator}
                        onValueChange={setConditionOperator}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForType(selectedState?.type || "TEXT").map(
                            (op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value">Condition Value</Label>
                      <Input
                        id="value"
                        value={conditionValue}
                        onChange={(e) => setConditionValue(e.target.value)}
                        placeholder={`Enter value to compare against ${selectedState?.name}`}
                        type={selectedState?.type === "NUMBER" ? "number" : "text"}
                        className="h-10"
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !label.trim() ||
              (nodeType === "prompt" && !selectedPromptId) ||
              (nodeType === "conditional" && !selectedStateId)
            }
          >
            Add Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
