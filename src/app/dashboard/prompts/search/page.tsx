"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Tables } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PromptSearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tables<"user_prompts">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_prompts")
      .select("*")
      .or(`description.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .eq("public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching prompts:", error);
      return;
    }

    setSearchResults(data || []);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Search Prompts</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search for prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
} 