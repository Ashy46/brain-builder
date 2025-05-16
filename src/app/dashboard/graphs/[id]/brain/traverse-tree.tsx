import { handleConditionalNode } from "./handle-nodes/handle-conditional-node";
import { handleAnalysisNode } from "./handle-nodes/handle-analysis-node";
import { handlePromptNode } from "./handle-nodes/handle-prompt-node";

import { createClient } from "@/lib/supabase/client";

import { Tables } from "@/types/supabase";

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
  current_value: string;
  type: "NUMBER" | "TEXT" | "BOOLEAN";
  promptId: string;
}

async function traverseTree(messages: Message[], graphId: string, authToken: string) {
  const supabase = createClient();

  const states = await loadStates(graphId);

  const updatedStates = await analyzeStates(states, messages, authToken);

  const { data, error } = await supabase
    .from("graphs")
    .select("child_node_id, graph_nodes!nodes_graph_id_fkey(*)")
    .eq("id", graphId)
    .single();

  if (error) {
    throw error;
  }

  const child_node_id: string = data.child_node_id;
  const graph_nodes: Tables<"graph_nodes">[] = data.graph_nodes;

  let nextNode: string | null = graph_nodes[0].id;

  while (nextNode) {
    const nodeType = await getNodeType(nextNode);

    if (nodeType === "CONDITIONAL") {
      const response = await handleConditionalNode(updatedStates, nextNode, authToken);
      nextNode = response;
    } else if (nodeType === "PROMPT") {
      const response = await handlePromptNode(messages, nextNode, authToken);
      return response;
    }
  }
}

async function loadStates(graphId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("graph_states")
    .select("id, graph_id, name, persistent, starting_value, type, prompt_id")
    .eq("graph_id", graphId);

  if (error) {
    console.error("Error loading states:", error);
    throw error;
  }

  const states: State[] = data.map((state) => ({
    id: state.id,
    graph_id: state.graph_id,
    name: state.name,
    persistent: state.persistent,
    starting_value: state.starting_value,
    current_value: state.starting_value ? state.starting_value : "0",
    type: state.type,
    promptId: state.prompt_id,
  }));

  return states;
}

async function analyzeStates(states: State[], messages: Message[], authToken: string) {
  const updatedStates = [];

  for (const state of states) {
    const result = await handleAnalysisNode(messages, state, authToken);
    const score = result?.score;
    updatedStates.push({
      ...state,
      current_value: score !== undefined && score !== null ? String(score) : "0",
    });
  }

  console.log("updatedStates", updatedStates);

  return updatedStates;
}

async function getNodeType(nodeId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("graph_nodes")
    .select("node_type")
    .eq("id", nodeId)
    .single();

  if (error) {
    throw error;
  }

  return data.node_type;
}
export { traverseTree };
