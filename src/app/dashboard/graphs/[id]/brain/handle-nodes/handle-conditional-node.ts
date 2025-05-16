import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";

async function handleConditionalNode(stateNum: number, nodeId: string, authToken: string) {
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
  if (conditional.condition_operator === "EQUALS") {
    boolean = stateNum === conditional.value;
  } else if (conditional.condition_operator === "GREATER_THAN") {
    boolean = stateNum > conditional.value;
  } else if (conditional.condition_operator === "LESS_THAN") {
    boolean = stateNum < conditional.value;
  } else if (conditional.condition_operator === "GREATER_THAN_OR_EQUAL_TO") {
    boolean = stateNum >= conditional.value;
  } else if (conditional.condition_operator === "LESS_THAN_OR_EQUAL_TO") {
    boolean = stateNum <= conditional.value;
  }

  if (boolean) {
    return node.true_child_id;
  } else {
    return node.false_child_id;
  }
}

export { handleConditionalNode };