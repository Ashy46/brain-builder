import { useState, useEffect } from "react";

import { X, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { ConditionalNodeData } from "./nodes";

interface State {
  id: string;
  name: string;
  type: "number" | "text";
}

type Condition = NonNullable<ConditionalNodeData["conditions"]>[number];

export function BuildConditionalDialog({
  open,
  onOpenChange,
  graphId,
  data,
  onConditionalChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
  data: ConditionalNodeData;
  onConditionalChange: (data: ConditionalNodeData) => void;
}) {
  const supabase = createClient();
  const [states, setStates] = useState<State[]>([]);
  const [conditions, setConditions] = useState<Condition[]>(
    data.conditions || []
  );
  const [operator, setOperator] = useState<"and" | "or">(
    data.operator || "and"
  );
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

  const addCondition = () => {
    setConditions([
      ...conditions,
      { stateId: "", operator: "equals", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleSave = () => {
    onConditionalChange({
      ...data,
      conditions,
      operator,
    });
    onOpenChange(false);
  };

  const getOperatorsForType = (stateType: "number" | "text") => {
    if (stateType === "number") {
      return [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
        { value: "greaterThan", label: "Greater Than" },
        { value: "lessThan", label: "Less Than" },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Build Conditional</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Match</span>
            <Select
              value={operator}
              onValueChange={(value: "and" | "or") => setOperator(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">All</SelectItem>
                <SelectItem value="or">Any</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">conditions</span>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {conditions.map((condition, index) => {
                const state = states.find((s) => s.id === condition.stateId);
                const operators = state ? getOperatorsForType(state.type) : [];

                return (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={condition.stateId}
                      onValueChange={(value) =>
                        updateCondition(index, "stateId", value)
                      }
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(index, "operator", value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type={state?.type === "number" ? "number" : "text"}
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(index, "value", e.target.value)
                      }
                      className="w-[150px]"
                    />

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Button variant="outline" onClick={addCondition} className="w-full">
            Add Condition
          </Button>

          <div className="flex justify-end gap-2">
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
