"use client";

import { useState } from "react";

import { SparklesIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { SettingsItem } from "./page";

export function OpenAISettings() {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/users/openai-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) throw new Error("Failed to update API key");
    } catch (error) {
      console.error("Error updating API key:", error);
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
