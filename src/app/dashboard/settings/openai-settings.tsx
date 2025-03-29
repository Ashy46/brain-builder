"use client";

import { useState, useEffect } from "react";

import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";

import { SettingsItem } from "./page";

export function OpenAISettings() {
  const [apiKey, setApiKey] = useState("");
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    const fetchJwt = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setJwt(session?.access_token || null);
    };

    fetchJwt();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/users/openai-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update API key");
      }

      toast.success("API key updated successfully");
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update API key"
      );
    }
  };

  return (
    <SettingsItem
      title="OpenAI API Key"
      description="Configure your OpenAI API key for AI features"
      icon={<SparklesIcon className="h-5 w-5 text-purple-500" />}
      dialogContent={
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleSubmit}>Save API Key</Button>
        </div>
      }
    />
  );
}
