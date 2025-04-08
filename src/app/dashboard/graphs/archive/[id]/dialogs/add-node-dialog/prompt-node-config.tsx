import { useState, useEffect } from "react";

import { ArrowLeft, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/tailwind";

import { Tables } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { CreatePromptDialog } from "@/app/dashboard/prompts/create-prompt-dialog";
import { useDebounce } from "./utils";
import { PromptNodeConfigProps } from "./types";

export function PromptNodeConfig({
  onBack,
  onComplete,
}: PromptNodeConfigProps) {
  const { user } = useAuth();

  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [prompts, setPrompts] = useState<Tables<"user_prompts">[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"personal" | "public">(
    "personal"
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_prompts")
        .select("*")
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

  const filteredPrompts = prompts.filter((prompt) => {
    const description = prompt.description || "";
    const matchesSearch = description
      .toLowerCase()
      .includes(debouncedSearchQuery.toLowerCase());
    const matchesMode =
      searchMode === "personal" ? prompt.user_id === user?.id : prompt.public;
    return matchesSearch && matchesMode;
  });

  const handleSubmit = () => {
    if (!label.trim()) {
      toast.error("Node label is required");
      return;
    }
    if (!selectedPromptId) {
      toast.error("Please select a prompt");
      return;
    }
    onComplete(label.trim(), selectedPromptId);
  };

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
        <h3 className="text-lg font-medium">Configure Prompt Node</h3>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt">Select Prompt</Label>
            <CreatePromptDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prompt
                </Button>
              }
              onPromptCreated={() => {
                fetchPrompts();
                toast.success("Prompt created successfully");
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id="search-mode"
                  checked={searchMode === "personal"}
                  onCheckedChange={(checked) =>
                    setSearchMode(checked ? "personal" : "public")
                  }
                />
                <label
                  htmlFor="search-mode"
                  className="text-sm text-muted-foreground"
                >
                  My Prompts
                </label>
              </div>
            </div>

            <div className="h-[200px] overflow-y-auto rounded-md border">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2" />
                  <p>No prompts found</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredPrompts.map((prompt) => {
                    const description = prompt.description || "Untitled Prompt";
                    return (
                      <div
                        key={prompt.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors",
                          selectedPromptId === prompt.id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                        onClick={() => setSelectedPromptId(prompt.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{description}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={prompt.public ? "default" : "secondary"}
                            >
                              {prompt.public ? "Public" : "Private"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Created{" "}
                              {new Date(prompt.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPromptId && (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <Label>Selected Prompt</Label>
            <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
              {prompts.find((p) => p.id === selectedPromptId)?.content || ""}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!label.trim() || !selectedPromptId}
        >
          Add Node
        </Button>
      </div>
    </div>
  );
}
