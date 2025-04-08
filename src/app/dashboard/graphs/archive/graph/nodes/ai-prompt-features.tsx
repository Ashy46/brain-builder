import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Wand2,
  MessageSquare,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

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

interface AIPromptFeaturesProps {
  nodeId: string;
  nodeLabel: string;
  currentPrompt?: string;
  onPromptChange: (nodeId: string, newPrompt: string) => void;
}

export function AIPromptFeatures({
  nodeId,
  nodeLabel,
  currentPrompt = "",
  onPromptChange,
}: AIPromptFeaturesProps) {
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { user } = useAuth();

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
        toast.error("Your session has expired. Please log in again.");
        return;
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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
          return;
        }
        if (response.status === 400) {
          toast.error(data.error || "Invalid request. Please check your input.");
          return;
        }
        if (response.status === 500) {
          toast.error("Server error. Please try again later.");
          return;
        }
        throw new Error(data.error || "Failed to generate prompt");
      }

      onPromptChange(nodeId, data.response);
    } catch (error) {
      console.error("Error generating prompt:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid response from server. Please try again.");
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to generate prompt"
        );
      }
    } finally {
      setIsGeneratingPrompt(false);
      setIsCustomPromptOpen(false);
      setCustomPrompt("");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={isGeneratingPrompt}
          >
            {isGeneratingPrompt ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              handleGeneratePrompt(
                `Write brief, direct instructions for roleplaying: "${currentPrompt}". No professional advice - just raw emotional expression. Keep it under 3 sentences. Example for "angry at therapist": Glare intensely. Use short, snappy responses. Cross arms and lean back defensively.`
              )
            }
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Fix & Improve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleGeneratePrompt(
                `Write 1-2 sentences max for roleplaying: "${currentPrompt}". Focus only on the key actions and reactions needed to show this emotional state. No professional advice.`
              )
            }
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Make Shorter
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleGeneratePrompt(
                `Write detailed roleplay instructions for: "${currentPrompt}". Include specific verbal responses, tone variations, gestures, expressions, and thought patterns. No professional advice - focus on raw emotional expression and method acting this state.`
              )
            }
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Make Longer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsCustomPromptOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Custom Prompt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
                  `For a node labeled "${nodeLabel}", ${customPrompt}`
                )
              }
              disabled={!customPrompt.trim()}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
