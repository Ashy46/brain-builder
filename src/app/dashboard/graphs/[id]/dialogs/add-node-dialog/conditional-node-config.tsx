import { useState, useEffect } from "react";

import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Tables, Enums } from "@/types/supabase";

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

import { getOperatorsForType } from "./utils";
import { ConditionalNodeConfigProps } from "./types";

export function ConditionalNodeConfig({
  onBack,
  onComplete,
  graphId,
}: ConditionalNodeConfigProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [states, setStates] = useState<Tables<"graph_states">[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [conditionValue, setConditionValue] = useState<string>("");
  const [conditionOperator, setConditionOperator] =
    useState<Enums<"conditional_operator">>("EQUALS");

  useEffect(() => {
    fetchStates();
  }, [graphId]);

  const fetchStates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("graph_states")
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

  const handleSubmit = () => {
    if (!label.trim()) {
      toast.error("Node label is required");
      return;
    }
    if (!selectedStateId) {
      toast.error("Please select a state");
      return;
    }
    onComplete(
      label.trim(),
      selectedStateId,
      conditionOperator,
      conditionValue
    );
  };

  const selectedState = states.find((s) => s.id === selectedStateId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">Configure Conditional Node</h3>
      </div>

      <div className="space-y-4">
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
            <Select value={selectedStateId} onValueChange={setSelectedStateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
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
                onValueChange={(value) =>
                  setConditionOperator(value as Enums<"conditional_operator">)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an operator" />
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
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!label.trim() || !selectedStateId}
        >
          Add Node
        </Button>
      </div>
    </div>
  );
}
