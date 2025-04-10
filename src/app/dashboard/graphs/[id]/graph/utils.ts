import { toast } from "sonner";

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
