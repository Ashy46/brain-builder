import { useState, useEffect } from "react";

import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleModeChange = (value: string) => {
    setSearchMode(value as "personal" | "public");
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
          <div className="flex flex-col gap-4">
            <Tabs
              value={searchMode}
              onValueChange={handleModeChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">My Prompts</TabsTrigger>
                <TabsTrigger value="public">Public Prompts</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Input
                placeholder={`Search ${
                  searchMode === "personal" ? "your" : "public"
                } prompts...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10"
                autoFocus
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="size-8 animate-spin mt-2" />
            </div>
          ) : (
            searchResults.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((prompt) => (
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
                      <Button variant="outline" asChild>
                        <a href={`/dashboard/prompts/${prompt.id}`}>
                          View Details
                        </a>
                      </Button>
                    </div>
                  ))
                ) : searchQuery.trim() !== "" && !isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    No {searchMode === "personal" ? "personal" : "public"}{" "}
                    prompts found matching your search
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
