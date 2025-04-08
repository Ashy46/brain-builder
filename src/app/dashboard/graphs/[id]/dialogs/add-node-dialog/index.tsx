"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { NodeTypeSelection } from "./node-type-selection";
import { PromptNodeConfig } from "./prompt-node-config";
import { ConditionalNodeConfig } from "./conditional-node-config";
import { AddNodeDialogProps } from "./types";

export function AddNodeDialog({
  open,
  onOpenChange,
  onAddNode,
  graphId,
  isRootNode = false,
}: AddNodeDialogProps) {
  const [step, setStep] = useState<"select" | "prompt" | "conditional">(
    "select"
  );
  const [nodeType, setNodeType] = useState<"prompt" | "conditional">("prompt");

  const handleNodeTypeSelect = (type: "prompt" | "conditional") => {
    setNodeType(type);
    setStep(type);
  };

  const handleBack = () => {
    setStep("select");
  };

  const handlePromptComplete = (label: string, promptId: string) => {
    const config = {
      promptId,
      promptDescription: "Description",
    };
    onAddNode("prompt", label, config);
    onOpenChange(false);
  };

  const handleConditionalComplete = (
    label: string,
    stateId: string,
    operator:
      | "EQUALS"
      | "NOT_EQUALS"
      | "MORE_THAN"
      | "MORE_THAN_OR_EQUAL_TO"
      | "LESS_THAN"
      | "LESS_THAN_OR_EQUAL_TO"
      | "CONTAINS"
      | "NOT_CONTAINS",
    value: string
  ) => {
    const config = {
      stateId,
      operator,
      value,
      stateName: "State Name",
    };
    onAddNode("conditional", label, config);
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    switch (step) {
      case "select":
        return "Add New Node";
      case "prompt":
        return null;
      case "conditional":
        return null;
      default:
        return "Add New Node";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          {getDialogTitle() && <DialogTitle>{getDialogTitle()}</DialogTitle>}
        </DialogHeader>

        {step === "select" && (
          <NodeTypeSelection onSelect={handleNodeTypeSelect} />
        )}

        {step === "prompt" && (
          <PromptNodeConfig
            onBack={handleBack}
            onComplete={handlePromptComplete}
          />
        )}

        {step === "conditional" && (
          <ConditionalNodeConfig
            onBack={handleBack}
            onComplete={handleConditionalComplete}
            graphId={graphId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
