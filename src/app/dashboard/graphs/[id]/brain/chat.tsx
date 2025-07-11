"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { traverseTree } from "./traverse-tree";
import { PersistentStateManager } from "./persistentStateManager";

import { useGraph } from "../context/graph-context";


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
  const [stateManager, setStateManager] = useState<PersistentStateManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Initialize state manager when graphId is available
    async function initializeStateManager() {
      if (graphId && !stateManager) {
        try {
          const manager = new PersistentStateManager(graphId);
          await manager.loadStates();
          setStateManager(manager);
          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing state manager:", error);
          toast.error("Failed to initialize state manager");
        }
      }
    }

    initializeStateManager();
  }, [graphId, stateManager]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        console.log('Scroll debug:', {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          canScroll: container.scrollHeight > container.clientHeight
        });

        // Force scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Also try scrolling the end element into view
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }
    };

    // Use multiple timing methods to ensure it works
    requestAnimationFrame(() => {
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if we have auth token and state manager
    if (!authToken) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Authentication error. Please log in again." }
      ]);
      toast.error("Authentication error. Please log in again.");
      return;
    }

    if (!stateManager || !isInitialized) {
      toast.error("State manager not initialized. Please wait or refresh the page.");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const tempMessages = [...messages, userMessage]; //reactive updates async so yeah
    setInput("");
    setIsLoading(true);

    try {
      // Get current states from the state manager
      const currentStates = stateManager.getCurrentStates();

      console.log("Chat currentStates", currentStates);

      // Pass states and stateManager to traverseTree
      const result = await traverseTree(tempMessages, graphId, authToken, currentStates, stateManager);

      console.log("result", result.updatedStates);

      // Note: States are now updated within traverseTree via the stateManager
      // No need to update states again here since it's done in analyzeStates

      const response = result.response;

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
      <div
        className="flex-1 overflow-y-auto min-h-0"
        ref={scrollRef}
        style={{ maxHeight: '100%' }}
      >
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Send a message to start chatting with the brain
              {!isInitialized && (
                <div className="text-sm mt-2">
                  <div className="flex space-x-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce delay-150"></div>
                  </div>
                  <span className="text-xs">Initializing state manager...</span>
                </div>
              )}
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
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || !authToken || !isInitialized}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !authToken || !isInitialized}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!authToken && (
          <p className="text-xs text-red-500 mt-2">
            Authentication error. Please log in or refresh the page.
          </p>
        )}
        {!isInitialized && authToken && (
          <p className="text-xs text-yellow-500 mt-2">
            Initializing state manager...
          </p>
        )}
      </form>
    </div>
  );
} 