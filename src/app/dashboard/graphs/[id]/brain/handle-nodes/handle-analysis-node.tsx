import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function handleAnalysisNode(messages: Message[], graphId: string, authToken: string) {
  const supabase = createClient();

  const { data: node, error: nodeError } = await supabase
    .from("graph_states")
    .select("*")
    .eq("graph_id", graphId)
    .single();

  if (nodeError) {
    console.error("Error fetching node:", nodeError);
    return null;
  }

  if (!node) {
    console.error("Node not found:", graphId);
    return null;
  }

  const promptId = node.prompt_id;

  const { data: prompt, error: promptError } = await supabase
    .from("user_prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (promptError) {
    console.error("Error fetching prompt:", promptError);
    return null;
  }

  if (!prompt) {
    console.error("Prompt not found:", promptId);
    return null;
  }

  const promptContent = prompt.content;
  console.log(promptContent);
  console.log(messages);

  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      prompt: promptContent
    }),
  });

  return response;
}

export { handleAnalysisNode };