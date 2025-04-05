"use client";

import { useState, useEffect } from "react";

import { TerminalIcon, CopyIcon, CheckIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import { SettingsItem } from "./page";

export function DeveloperSettings() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async () => {
    if (jwt) {
      await navigator.clipboard.writeText(jwt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <SettingsItem
      title="Developer Settings"
      description="View your API tokens and development tools"
      icon={<TerminalIcon className="h-5 w-5 text-blue-500" />}
      dialogContent={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is your current JWT token. It is used to authenticate your
            requests to the API. Do not share it with anyone. This is primarily
            used for testing. If you do not know what this is, you
            can ignore it.
          </p>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">JWT Token</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-1 rounded-md bg-zinc-900 p-2">
              <code className="text-sm text-zinc-100 break-all line-clamp-2">
                {jwt || "No token found"}
              </code>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              To use this token in API requests, include it in the Authorization
              header:
            </p>
            <div className="mt-1 rounded-md bg-zinc-900 p-2">
              <code className="text-sm text-zinc-100 break-all">
                Authorization: Bearer{" "}
                {jwt ? "your-token-here" : "No token found"}
              </code>
            </div>
          </div>
        </div>
      }
    />
  );
}
