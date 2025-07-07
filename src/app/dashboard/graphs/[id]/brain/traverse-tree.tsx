import { handleConditionalNode } from "./handle-nodes/handle-conditional-node";
import { handleAnalysisNode } from "./handle-nodes/handle-analysis-node";
import { handlePromptNode } from "./handle-nodes/handle-prompt-node";

import { createClient } from "@/lib/supabase/client";
import { State, PersistentStateManager } from "./persistentStateManager";

import { Tables } from "@/types/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TraverseTreeResult {
  response: any;
  updatedStates: State[];
}

async function traverseTree(
  messages: Message[],
  graphId: string,
  authToken: string,
  states: State[],
  stateManager?: PersistentStateManager
): Promise<TraverseTreeResult> {
  const supabase = createClient();

  const updatedStates = await analyzeStates(states, messages, authToken, stateManager);

  const { data, error } = await supabase
    .from("graphs")
    .select("child_node_id, graph_nodes!nodes_graph_id_fkey(*)")
    .eq("id", graphId)
    .single();

  if (error) {
    throw error;
  }

  const child_node_id: string = data.child_node_id;

  let nextNode: string | null = child_node_id;

  while (nextNode) {
    const nodeType = await getNodeType(nextNode);

    if (nodeType === "CONDITIONAL") {
      console.log("About to call handleConditionalNode");
      const response = await handleConditionalNode(updatedStates, nextNode, authToken);
      nextNode = response;
    } else if (nodeType === "PROMPT") {
      const response = await handlePromptNode(messages, nextNode, authToken);
      return { response, updatedStates };
    }
  }

  // If we reach here, something went wrong
  throw new Error("No valid response node found");
}

async function analyzeStates(
  states: State[],
  messages: Message[],
  authToken: string,
  stateManager?: PersistentStateManager
) {
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

  // If stateManager is provided, update the states BEFORE we traverse the trees
  if (stateManager) {
    console.log("HERE UPDATING STATES", stateManager);
    stateManager.updateStates(updatedStates);
    // Return the current states from the manager which now include the persistence logic
    return stateManager.getCurrentStates();
  }

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
export type { TraverseTreeResult };
