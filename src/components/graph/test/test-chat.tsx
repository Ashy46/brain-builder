import { useState, useRef, useEffect } from "react";

import { Send } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/supabase";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TestChatProps {
  id: string;
  isOpen: boolean;
}

export function TestChat({ id, isOpen }: TestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [jwt, setJwt] = useState<string | null>(null);
  const [currentGraphNodes, setCurrentGraphNodes] = useState<
    Database["public"]["Tables"]["graph_nodes"]["Row"][]
  >([]);
  const [states, setStates] = useState<
    Database["public"]["Tables"]["graph_states"]["Row"][]
  >([]);
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [traversalLog, setTraversalLog] = useState<string[]>([]);

  useEffect(() => {
    console.log(currentValues);
  }, [currentValues]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchJwt = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setJwt(session?.access_token || null);
    };

    const fetchGraphNodes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("graph_nodes")
        .select("*")
        .eq("graph_id", id);
      setCurrentGraphNodes(data || []);
    };

    const fetchStates = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("graph_states")
        .select("*")
        .eq("graph_id", id);

      if (data) {
        setStates(data);
        // Initialize current values with starting values
        const initialValues: Record<string, string> = {};
        data.forEach(state => {
          initialValues[state.id] = state.starting_value || "0";
        });
        setCurrentValues(initialValues);
      }
    };

    fetchGraphNodes();
    fetchStates();
    fetchJwt();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  if (!isOpen) return null;

  const findAnalysisNode = () => {
    return currentGraphNodes.find(
      (node) =>
        typeof node.data === "object" &&
        node.data !== null &&
        "type" in node.data &&
        node.data.type === "analysis"
    );
  };

  const findNodeById = (id: string) => {
    return currentGraphNodes.find((node) => node.id === id);
  };

  const fetchNextNode = async (currentNode: Database["public"]["Tables"]["graph_nodes"]["Row"], conditional: boolean) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("graph_node_edges")
      .select("*")
      .eq("source_node_id", currentNode.id);

    if (error) {
      console.error("Error fetching next node:", error);
      return null;
    }

    if (typeof currentNode.data === 'object' && currentNode.data !== null && 'type' in currentNode.data) {
      if (currentNode.data.type === "conditional") {
        const nodeData = currentNode.data as { trueChildId: string; falseChildId: string };
        if (conditional) {
          return findNodeById(nodeData.trueChildId);
        } else {
          return findNodeById(nodeData.falseChildId);
        }
      }
    }

    return data[0]?.target_node_id;
  }

  const traverseGraph = async () => {
    const analysisNode = findAnalysisNode();
    if (!analysisNode) {
      console.error("No analysis node found in the graph.");
      return;
    }

    let currentNode = analysisNode;
    console.log("Starting graph traversal...");
    console.log("Current values:", currentValues);

    while (currentNode) {
      console.log("Current node:", currentNode);
      if (typeof currentNode.data === 'object' && currentNode.data !== null && 'type' in currentNode.data) {
        if (currentNode.data.type == "conditional") {
          const nodeData = currentNode.data as {
            trueChildId: string;
            falseChildId: string;
            conditions: {
              value: string;
              stateId: string;
              operator: string;
            }[];
          };

          let conditionResult = true;

          // Evaluate each condition
          for (const condition of nodeData.conditions) {
            const currentValue = currentValues[condition.stateId];
            const conditionValue = condition.value;

            switch (condition.operator) {
              case "greaterThan":
                conditionResult = conditionResult && parseFloat(currentValue) > parseFloat(conditionValue);
                break;
              case "lessThan":
                conditionResult = conditionResult && parseFloat(currentValue) < parseFloat(conditionValue);
                break;
              case "equals":
                conditionResult = conditionResult && currentValue === conditionValue;
                break;
              case "notEquals":
                conditionResult = conditionResult && currentValue !== conditionValue;
                break;
              case "greaterThanOrEquals":
                conditionResult = conditionResult && parseFloat(currentValue) >= parseFloat(conditionValue);
                break;
              case "lessThanOrEquals":
                conditionResult = conditionResult && parseFloat(currentValue) <= parseFloat(conditionValue);
                break;
              default:
                console.warn(`Unknown operator: ${condition.operator}`);
                conditionResult = false;
            }
          }

          // Get the next node based on condition result
          const nextNodeId = conditionResult ? nodeData.trueChildId : nodeData.falseChildId;
          const nextNode = findNodeById(nextNodeId);
          if (!nextNode) {
            console.error(`Next node not found for ID: ${nextNodeId}`);
            break;
          }
          currentNode = nextNode;
          continue;
        }
        else if (currentNode.data.type == "prompt") {
          const nodeData = currentNode.data as {
            prompt: string;
          };

          const response = await fetch("/api/ai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({
              prompt: nodeData.prompt,
              messages: messages,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to analyze message");
          }

          if (typeof data.score !== "number") {
            throw new Error("Invalid score received from server");
          }
          
        }
      }
    }
  };

  const findNegativityState = () => {
    return states.find((state) => state.name === "negativity");
  };

  const analyzeMessage = async (messages: Message[]) => {
    const negativityState = findNegativityState();
    if (!negativityState || !jwt) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze message");
      }

      if (typeof data.score !== "number") {
        throw new Error("Invalid score received from server");
      }

      // Update the current value instead of the state itself
      setCurrentValues(prev => ({
        ...prev,
        [negativityState.id]: data.score.toString()
      }));

      // Add a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error analyzing message:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !jwt) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          prompt: input,
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let accumulatedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        accumulatedContent += text;
        setStreamingContent(accumulatedContent);
      }

      const assistantMessage = { role: "assistant" as const, content: accumulatedContent };
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      setStreamingContent("");

      await analyzeMessage(newMessages);

      // Traverse the graph after processing the message
      console.log("Traversing graph after message processing...");
      await traverseGraph();
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Card className="fixed right-4 top-4 h-[calc(100vh-2rem)] w-96 shadow-lg bg-card text-card-foreground">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Test Chat</h2>
          <div className="flex gap-2">
            {states.map((state) => (
              <Badge key={state.id} variant="secondary">
                {state.name}: {currentValues[state.id] || state.starting_value || "null"}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : message.role === "system"
                      ? "bg-yellow-100 text-yellow-900 border border-yellow-300 mr-auto"
                      : "bg-muted text-muted-foreground mr-auto"
                    } max-w-[80%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
                >
                  {message.content}
                </div>
              ))}
              {streamingContent && (
                <div className="bg-muted text-muted-foreground p-3 rounded-lg max-w-[80%] mr-auto">
                  {streamingContent}
                </div>
              )}
              {isLoading && !streamingContent && !isAnalyzing && (
                <div className="bg-muted text-muted-foreground p-3 rounded-lg max-w-[80%] mr-auto">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-md bg-background/80 backdrop-blur-[2px] text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring h-10"
              disabled={!jwt}
            />
            <Button type="submit" disabled={isLoading || !jwt} className="h-10">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
