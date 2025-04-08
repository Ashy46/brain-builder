import { MessageSquare, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";

import { NodeTypeSelectionProps } from "./types";

export function NodeTypeSelection({ onSelect }: NodeTypeSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Select Node Type</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the type of node you want to add to your graph
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-3"
          onClick={() => onSelect("prompt")}
        >
          <MessageSquare className="h-8 w-8" />
          <div className="text-center">
            <div className="font-medium">Prompt Node</div>
            <div className="text-xs text-muted-foreground mt-1">
              Process prompts with AI
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-3"
          onClick={() => onSelect("conditional")}
        >
          <GitBranch className="h-8 w-8" />
          <div className="text-center">
            <div className="font-medium">Conditional Node</div>
            <div className="text-xs text-muted-foreground mt-1">
              Branch based on state conditions
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
