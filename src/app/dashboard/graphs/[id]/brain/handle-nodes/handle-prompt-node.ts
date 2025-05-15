import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}


async function handlePromptNode(messages: Message[], nodeId: string, authToken: string) {
  const supabase = createClient();

  const { data: node, error: nodeError } = await supabase
    .from("graph_prompt_nodes")
    .select("*")
    .eq("graph_node_id", nodeId)
    .single();

  if (nodeError) {
    console.error("Error fetching node:", nodeError);
    return null;
  }

  if (!node) {
    console.error("Node not found:", nodeId);
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

  const response = await fetch("/api/ai/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        prompt: prompt.content,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      }),
    });

  return response;
}

export { handlePromptNode };