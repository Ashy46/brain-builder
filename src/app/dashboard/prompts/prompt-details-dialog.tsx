"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";

import { useAuth } from "@/lib/hooks/use-auth";
import { Database } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PromptDetailsDialogProps {
  trigger: React.ReactNode;
  prompt: Database["public"]["Tables"]["user_prompts"]["Row"];
}

function ModelConfigView({
  prompt,
}: {
  prompt: Database["public"]["Tables"]["user_prompts"]["Row"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          View Model Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Configuration</DialogTitle>
          <DialogDescription>
            Current model settings for this prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Model</Label>
            <div className="text-sm">{prompt.llm_model}</div>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {prompt.temperature}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Controls randomness. Higher values make the output more random.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm text-muted-foreground">
                {prompt.max_tokens}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum number of tokens to generate.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Top P</Label>
              <span className="text-sm text-muted-foreground">
                {prompt.top_p}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Controls diversity via nucleus sampling.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Frequency Penalty</Label>
              <span className="text-sm text-muted-foreground">
                {prompt.frequency_penalty}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Reduces repetition of the same lines.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Presence Penalty</Label>
              <span className="text-sm text-muted-foreground">
                {prompt.presence_penalty}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Encourages new topics and concepts.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PromptDetailsDialog({
  trigger,
  prompt,
}: PromptDetailsDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Prompt Details</DialogTitle>
          <DialogDescription>
            View the details of this prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Description</Label>
            <div className="text-sm">
              {prompt.description || "No description"}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Content</Label>
            <div className="text-sm whitespace-pre-wrap min-h-[200px] max-h-[200px] overflow-auto p-4 rounded-md bg-muted">
              {prompt.content || "No content"}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Status</Label>
              <Badge variant={prompt.public ? "default" : "secondary"}>
                {prompt.public ? "Public" : "Private"}
              </Badge>
              {prompt.user_id === user?.id && (
                <Badge variant="outline">Created by you</Badge>
              )}
            </div>
            <ModelConfigView prompt={prompt} />
          </div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(prompt.created_at).toLocaleDateString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
