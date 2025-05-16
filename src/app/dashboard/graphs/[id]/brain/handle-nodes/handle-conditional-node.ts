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

  const  { data: conditional, error: conditionalError } = await supabase
    .from("graph_conditional_node_conditions")
    .select("*")
    .eq("graph_conditional_node_id", node.id)
    .single();

  if (conditionalError) {
    console.error("Error fetching conditional:", conditionalError);
  }

  let boolean = false;
  if (conditional.conditional_operator === "EQUALS") {
    boolean = parseFloat(states[0].current_value) === parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "MORE_THAN") {
    boolean = parseFloat(states[0].current_value) > parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "LESS_THAN") {
    boolean = parseFloat(states[0].current_value) < parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "MORE_THAN_OR_EQUAL_TO") {
    boolean = parseFloat(states[0].current_value) >= parseFloat(conditional.value);
  } else if (conditional.conditional_operator === "LESS_THAN_OR_EQUAL_TO") {
    boolean = parseFloat(states[0].current_value) <= parseFloat(conditional.value);
  }

  if (boolean) {
    return node.true_child_id;
  } else {
    return node.false_child_id;
  }
}

export { handleConditionalNode };