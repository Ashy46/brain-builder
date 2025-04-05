"use client";

import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";

import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Database, Tables } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface EditPromptDialogProps {
  prompt: Tables<"user_prompts">;
  trigger?: React.ReactNode;
  onPromptUpdated?: () => void;
}

type LLMModel = Database["public"]["Enums"]["llm_model"];

interface PromptFormData {
  description: string;
  content: string;
  llm_model: LLMModel;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  public: boolean;
}

function ModelConfigDialog({
  formData,
  setFormData,
}: {
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Configure Model Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Configuration</DialogTitle>
          <DialogDescription>
            Fine-tune your model settings for optimal results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="llm_model">Model</Label>
            <Select
              value={formData.llm_model}
              onValueChange={(value: LLMModel) =>
                setFormData((prev) => ({
                  ...prev,
                  llm_model: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4 Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {formData.temperature}
              </span>
            </div>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, temperature: value }))
              }
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-sm text-muted-foreground">
              Controls randomness. Higher values make the output more random.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm text-muted-foreground">
                {formData.max_tokens}
              </span>
            </div>
            <Slider
              value={[formData.max_tokens]}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, max_tokens: value }))
              }
              min={1}
              max={4000}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of tokens to generate.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Top P</Label>
              <span className="text-sm text-muted-foreground">
                {formData.top_p}
              </span>
            </div>
            <Slider
              value={[formData.top_p]}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, top_p: value }))
              }
              min={0}
              max={1}
              step={0.1}
            />
            <p className="text-sm text-muted-foreground">
              Controls diversity via nucleus sampling.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Frequency Penalty</Label>
              <span className="text-sm text-muted-foreground">
                {formData.frequency_penalty}
              </span>
            </div>
            <Slider
              value={[formData.frequency_penalty]}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, frequency_penalty: value }))
              }
              min={-2}
              max={2}
              step={0.1}
            />
            <p className="text-sm text-muted-foreground">
              Reduces repetition of the same lines.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Presence Penalty</Label>
              <span className="text-sm text-muted-foreground">
                {formData.presence_penalty}
              </span>
            </div>
            <Slider
              value={[formData.presence_penalty]}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, presence_penalty: value }))
              }
              min={-2}
              max={2}
              step={0.1}
            />
            <p className="text-sm text-muted-foreground">
              Encourages new topics and concepts.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditPromptDialog({
  prompt,
  trigger,
  onPromptUpdated,
}: EditPromptDialogProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>({
    description: prompt.description || "",
    content: prompt.content || "",
    llm_model: prompt.llm_model,
    temperature: prompt.temperature,
    max_tokens: prompt.max_tokens,
    top_p: prompt.top_p,
    frequency_penalty: prompt.frequency_penalty,
    presence_penalty: prompt.presence_penalty,
    public: prompt.public || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error: promptError } = await supabase
        .from("user_prompts")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prompt.id)
        .eq("user_id", user.id);

      if (promptError) throw promptError;

      toast.success("Prompt updated successfully");
      setOpen(false);
      onPromptUpdated?.();
    } catch (error) {
      console.error("Failed to update prompt:", error);
      toast.error("Failed to update prompt");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Edit Prompt</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Modify your prompt settings below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter a description for your prompt"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Enter your prompt content"
                required
                className="min-h-[200px] max-h-[200px] resize-none overflow-auto"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="public">Make Public</Label>
                <Switch
                  id="public"
                  checked={formData.public}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, public: checked }))
                  }
                />
              </div>
              <ModelConfigDialog
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
