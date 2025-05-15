"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { handlePromptNode } from "./handle-nodes/handle-prompt-node";
import { handleAnalysisNode } from "./handle-nodes/handle-analysis-node";

import { useGraph } from "../layout";


interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const { isAuthenticated } = useAuth();
  const { graphId } = useGraph();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get session token when component mounts (client-side only)
    async function getToken() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token || null;
        setAuthToken(token);
      } catch (error) {
        console.error("Error getting auth token:", error);
        setAuthToken(null);
      }
    }

    if (isAuthenticated) {
      getToken();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if we have auth token
    if (!authToken) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Authentication error. Please log in again." }
      ]);
      toast.error("Authentication error. Please log in again.");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const tempMessages = [...messages, userMessage]; //reactive updates async so yeah
    setInput("");
    setIsLoading(true);

    try {
      const response = await handleAnalysisNode(tempMessages, graphId, authToken);

      if (!response?.ok) {
        const errorData = await response?.json().catch(() => null);
        console.error("API Error:", response?.status, errorData);

        // Handle specific error cases
        if (errorData?.code === "VALIDATION_ERROR" && errorData?.error?.includes("OpenAI API key")) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span>{errorData.error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = "/dashboard/settings"}
                className="flex items-center gap-2"
              >
                <Settings size={14} />
                Go to Settings
              </Button>
            </div>,
            { duration: 10000 }
          );
        } else {
          toast.error(errorData?.error || `Request failed with status ${response?.status}`);
        }

        throw new Error(errorData?.error || `Failed to get response: ${response?.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === "assistant") {
              newMessages[newMessages.length - 1].content = assistantMessage;
            } else {
              newMessages.push({ role: "assistant", content: assistantMessage });
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again or check your configuration.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSettings = () => {
    window.location.href = "/dashboard/settings";
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Send a message to start chatting with the brain
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !authToken}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!authToken && (
          <p className="text-xs text-red-500 mt-2">
            Authentication error. Please log in or refresh the page.
          </p>
        )}
      </form>
    </div>
  );
} 