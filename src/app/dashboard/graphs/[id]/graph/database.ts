import { toast } from "sonner";
import { Node, Edge } from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";

export async function updateNodePositionInDatabase(
  nodeId: string,
  position: { x: number; y: number }
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("graph_nodes")
    .update({ pos_x: position.x, pos_y: position.y })
    .eq("id", nodeId);

  if (error) {
    console.error("Failed to update node position:", error);
    toast.error("Failed to update node position");
  }
}

export async function deleteNodeFromDatabase(nodeId: string) {
  const supabase = createClient();

  const { error: conditionalError } = await supabase
    .from("graph_conditional_nodes")
    .delete()
    .eq("graph_node_id", nodeId);

  if (conditionalError) {
    console.error("Error deleting conditional node:", conditionalError);
  }

  const { error } = await supabase
    .from("graph_nodes")
    .delete()
    .eq("id", nodeId);

  if (error) {
    console.error("Error deleting node:", error);
  }
}

export async function updateGraphConnection(
  graphId: string,
  childNodeId: string | null
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("graphs")
    .update({ child_node_id: childNodeId })
    .eq("id", graphId);

  if (error) {
    console.error("Failed to update graph connection:", error);
    toast.error("Failed to update graph connection");
    return false;
  }

  toast.success("Graph connection updated");
  return true;
}

export async function updateConditionalConnection(
  nodeId: string,
  isTrue: boolean,
  targetId: string | null
) {
  const supabase = createClient();

  const field = isTrue ? "true_child_id" : "false_child_id";

  const { error } = await supabase
    .from("graph_conditional_nodes")
    .update({ [field]: targetId })
    .eq("graph_node_id", nodeId);

  if (error) {
    console.error("Failed to update conditional connection:", error);
    toast.error("Failed to update conditional connection");
    return false;
  }

  toast.success("Conditional connection updated");
  return true;
}

export async function saveEdgeToDatabase(edge: Edge, graphId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("graph_edges")
    .upsert({
      id: edge.id,
      graph_id: graphId,
      source_node_id: edge.source,
      target_node_id: edge.target,
    })
    .select();

  if (error) {
    console.error("Failed to save edge:", error);
    toast.error("Failed to save edge");
    return null;
  }

  return edge;
}

export async function deleteEdgeFromDatabase(edgeId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("graph_edges")
    .delete()
    .eq("id", edgeId);

  if (error) {
    console.error("Failed to delete edge:", error);
    toast.error("Failed to delete edge");
  }
}

export async function fetchEdgesFromDatabase(graphId: string): Promise<Edge[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("graph_edges")
    .select("*")
    .eq("graph_id", graphId);

  if (error) {
    console.error("Failed to fetch edges:", error);
    toast.error("Failed to fetch edges");
    return [];
  }

  return data.map((edge) => ({
    id: edge.id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    sourceHandle: null,
    targetHandle: null,
  }));
}

export async function fetchNodesAndEdges(graphId: string) {
  const supabase = createClient();

  const { data: nodesData, error: nodesError } = await supabase
    .from("graph_nodes")
    .select("*")
    .eq("graph_id", graphId);

  if (nodesError) {
    console.error(nodesError);
    toast.error("Failed to fetch nodes");
    return { nodes: [], edges: [] };
  }

  const { data: conditionalNodes, error: conditionalError } = await supabase
    .from("graph_conditional_nodes")
    .select("*")
    .in(
      "graph_node_id",
      nodesData.map((node) => node.id)
    );

  if (conditionalError) {
    console.error(conditionalError);
    toast.error("Failed to fetch conditional nodes");
    return { nodes: [], edges: [] };
  }

  const { data: graphData, error: graphError } = await supabase
    .from("graphs")
    .select("*")
    .eq("id", graphId)
    .single();

  if (graphError) {
    console.error(graphError);
    toast.error("Failed to fetch graph data");
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [
    {
      id: "1",
      type: "analysis",
      data: { label: "Start" },
      position: { x: 0, y: 0 },
      draggable: false,
    },
    ...nodesData.map((node) => ({
      id: node.id,
      type: node.node_type.toLowerCase(),
      data: { id: node.id },
      position: { x: node.pos_x, y: node.pos_y },
    })),
  ];

  const edges: Edge[] = [];

  if (graphData.child_node_id) {
    edges.push({
      id: `1-${graphData.child_node_id}`,
      source: "1",
      target: graphData.child_node_id,
    });
  }

  for (const conditionalNode of conditionalNodes) {
    if (conditionalNode.true_child_id) {
      edges.push({
        id: `${conditionalNode.graph_node_id}-true-${conditionalNode.true_child_id}`,
        source: conditionalNode.graph_node_id,
        target: conditionalNode.true_child_id,
        sourceHandle: "true",
      });
    }
    if (conditionalNode.false_child_id) {
      edges.push({
        id: `${conditionalNode.graph_node_id}-false-${conditionalNode.false_child_id}`,
        source: conditionalNode.graph_node_id,
        target: conditionalNode.false_child_id,
        sourceHandle: "false",
      });
    }
  }

  return { nodes, edges };
}
