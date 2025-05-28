import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface State {
  id: string;
  graph_id: string;
  name: string;
  persistent: boolean;
  starting_value: string | null;
  current_value: string | null;
  type: "NUMBER" | "TEXT" | "BOOLEAN";
  promptId: string;
}

async function handleAnalysisNode(messages: Message[], state: State, authToken: string) {
  const supabase = createClient();

  const promptId = state.promptId;

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
      label: state.name,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      prompt: promptContent
    }),
  });

  if (!response.ok) {
    console.error("Error from /api/ai/analyze:", response.statusText);
    return null;
  }

  const data = await response.json();
  return data;
}

export { handleAnalysisNode };