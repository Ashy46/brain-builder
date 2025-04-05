"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Tables } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Debounce helper function
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

export default function PromptSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tables<"user_prompts">[]>([]);
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          className="p-2 h-auto" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search for prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mt-3" />}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
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
          ))}
        </div>
      ) : searchQuery.trim() !== "" && (
        <div className="text-center text-muted-foreground py-8">
          No prompts found matching your search
        </div>
      )}
    </div>
  );
} 