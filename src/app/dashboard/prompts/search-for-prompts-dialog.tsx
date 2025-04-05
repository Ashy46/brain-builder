import { useState, useEffect } from "react";

import { Loader2, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PromptDetailsDialog } from "./prompt-details-dialog";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchPromptDialogProps {
  trigger: React.ReactNode;
}

export function SearchForPromptsDialog({ trigger }: SearchPromptDialogProps) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"personal" | "public">("public");
  const [searchResults, setSearchResults] = useState<Tables<"user_prompts">[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const baseQuery = supabase
      .from("user_prompts")
      .select("*")
      .or(`description.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    const { data, error } = await (searchMode === "personal"
      ? baseQuery.eq("user_id", user?.id)
      : baseQuery.eq("public", true));

    if (error) {
      console.error("Error searching prompts:", error);
      return;
    }

    setSearchResults(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchMode]);

  const handleModeChange = (checked: boolean) => {
    setSearchMode(checked ? "personal" : "public");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search for Prompts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder={`Search ${
                searchMode === "personal" ? "your" : "public"
              } prompts...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Switch
                id="search-mode"
                checked={searchMode === "personal"}
                onCheckedChange={handleModeChange}
              />
              <label
                htmlFor="search-mode"
                className="text-sm text-muted-foreground"
              >
                My Prompts
              </label>
            </div>
          </div>

          <ScrollArea className="h-[60vh] w-full">
            <div className="flex flex-col h-full min-h-[60vh]">
              {isLoading ? (
                <div className="flex-1 flex justify-center items-center min-h-[60vh]">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">
                            {prompt.description || "Untitled Prompt"}
                          </span>
                          <Badge
                            variant={prompt.public ? "default" : "secondary"}
                          >
                            {prompt.public ? "Public" : "Private"}
                          </Badge>
                          {searchMode === "public" &&
                            prompt.user_id === user?.id && (
                              <Badge variant="outline">Created by you</Badge>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Created{" "}
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <PromptDetailsDialog
                        trigger={
                          <Button variant="outline">View Details</Button>
                        }
                        prompt={prompt}
                      />
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() !== "" ? (
                <div className="flex-1 flex flex-col gap-2 justify-center items-center min-h-[60vh] text-muted-foreground">
                  <Search className="size-8" />
                  <p>
                    No {searchMode === "personal" ? "personal" : "public"}{" "}
                    prompts found matching your search
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2 justify-center items-center min-h-[60vh] text-muted-foreground">
                  <Search className="size-8" />
                  <p>Start typing to search prompts</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
