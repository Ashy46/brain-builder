import { toast } from "sonner";
import { Edge } from "@xyflow/react";
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

  const { error } = await supabase
    .from("graph_nodes")
    .delete()
    .eq("id", nodeId);

  if (error) {
    console.error("Failed to delete node:", error);
    toast.error("Failed to delete node");
  }
}

export async function saveEdgeToDatabase(
  edge: Edge,
  graphId: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("graph_edges")
    .upsert({
      id: edge.id,
      graph_id: graphId,
      source_node_id: edge.source,
      target_node_id: edge.target
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
