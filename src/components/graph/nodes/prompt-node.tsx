import { Handle, Position } from "@xyflow/react";
import { useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  Wand2,
  MessageSquare,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/tailwind";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NodePropsWithData, PromptNodeData } from "./types";
import { AIPromptFeatures } from "./ai-prompt-features";

function NodeTypeLabel({ type }: { type: string }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-3 px-4 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function PromptNode({
  data,
  isConnectable,
  selected,
  id,
}: NodePropsWithData) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { user } = useAuth();
  const promptData = data as PromptNodeData;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newData = {
      ...data,
      prompt: e.target.value,
    };
    promptData.onPromptChange?.(id, newData as PromptNodeData);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    if (labelRef.current) {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 80);
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    e.stopPropagation();
  };

  const handleAIPromptChange = (nodeId: string, newPrompt: string) => {
    const newData = {
      ...data,
      prompt: newPrompt,
    };
    promptData.onPromptChange?.(nodeId, newData as PromptNodeData);
  };

  const handleGeneratePrompt = async (prompt: string) => {
    if (!user?.openai_api_key) {
      toast.error(
        "Please set your OpenAI API key in settings to use AI features"
      );
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No access token");
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate prompt");
      }

      const { response: generatedPrompt } = await response.json();
      const newData = {
        ...data,
        prompt: generatedPrompt,
      };
      promptData.onPromptChange?.(id, newData as PromptNodeData);
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate prompt"
      );
    } finally {
      setIsGeneratingPrompt(false);
      setIsCustomPromptOpen(false);
      setCustomPrompt("");
    }
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-green-500/20",
          selected && "border-2 border-green-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />

        <div className="flex items-center justify-center mt-2">
          <input
            ref={labelRef}
            type="text"
            value={data.label}
            onChange={handleLabelChange}
            onKeyDown={handleKeyDown}
            className="w-full text-sm text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            aria-label="Node label"
          />
          <AIPromptFeatures
            nodeId={id}
            nodeLabel={data.label}
            currentPrompt={promptData.prompt}
            onPromptChange={handleAIPromptChange}
          />
        </div>

        <Textarea
          value={promptData.prompt ?? ""}
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt here..."
          className="w-full text-sm bg-transparent min-h-[100px] mt-2 resize-none"
        />
      </div>

      <Dialog open={isCustomPromptOpen} onOpenChange={setIsCustomPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom AI Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Tell the AI what you want to change or improve..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomPromptOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleGeneratePrompt(
                  `For a node labeled "${data.label}", ${customPrompt}`
                )
              }
              disabled={!customPrompt.trim()}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 