import { useState, useEffect } from "react";

import { Search, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tables<"user_prompts">[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_prompts")
      .select("*")
      .or(`description.ilike.%${query}%,content.ilike.%${query}%`)
      .eq("public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching prompts:", error);
      return;
    }

    setSearchResults(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search for Prompts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mt-3" />}
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-4">
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
                      <Badge variant={prompt.public ? "default" : "secondary"}>
                        {prompt.public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(prompt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="outline" asChild>
                    <a href={`/dashboard/prompts/${prompt.id}`}>View Details</a>
                  </Button>
                </div>
              ))
            ) : searchQuery.trim() !== "" && !isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                No prompts found matching your search
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
