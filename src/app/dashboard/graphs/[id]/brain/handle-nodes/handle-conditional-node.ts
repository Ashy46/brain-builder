import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";

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

/**
 * Handles the conditional node logic by checking the states of the graph and the conditions of the node.
 * It correlates the current conditional with the correct state and them evalutes the condiutional, pushing the 
 * result into an array. Currrently only supports NUMBER states. 
 * 
 * @param states - The states of the graph
 * @param nodeId - The id of the node
 * @param authToken - The auth token
 * @returns 
 */
async function handleConditionalNode(states: State[], nodeId: string, authToken: string) {
  const supabase = createClient();

  const { data: node, error: nodeError } = await supabase
    .from("graph_conditional_nodes")
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

  const  { data: conditionals, error: conditionalError } = await supabase
    .from("graph_conditional_node_conditions")
    .select("*")
    .eq("graph_conditional_node_id", node.id)

  if (conditionalError) {
    console.error("Error fetching conditional:", conditionalError);
  }

  console.log(conditionals);


  let booleans: boolean[] = [];
  for (const conditional of conditionals || []) {

    let currentState = states.find(state => state.id === conditional.state_id);
    let boolean: boolean = false;

  if (conditional.conditional_operator === "EQUALS") {
    boolean = parseFloat(currentState?.current_value || "0") === parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "MORE_THAN") {
    boolean = parseFloat(currentState?.current_value || "0") > parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "LESS_THAN") {
    boolean = parseFloat(currentState?.current_value || "0") < parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "MORE_THAN_OR_EQUAL_TO") {
    boolean = parseFloat(currentState?.current_value || "0") >= parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "LESS_THAN_OR_EQUAL_TO") {
    boolean = parseFloat(currentState?.current_value || "0") <= parseFloat(conditional.value);
  }
  booleans.push(boolean);
}

  const conditional_evaluator = node.conditional_evaluator;

  if (conditional_evaluator === "and") {
    for (const boolean of booleans) {
      console.log(boolean);
      if (!boolean) {
        return node.false_child_id;
      }
    }
    return node.true_child_id;
  } else if (conditional_evaluator === "or") {
    for (const boolean of booleans) {
      console.log(boolean);
      if (boolean) {
        return node.true_child_id;
      }
    }
    return node.false_child_id; 
  }
}
export { handleConditionalNode };