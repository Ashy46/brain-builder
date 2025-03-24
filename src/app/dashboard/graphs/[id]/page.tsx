"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function GraphPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const supabase = createClient();
  const graphRef = useRef<GraphRef>(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>(null);

  useEffect(() => {
    async function fetchGraph() {
      if (!user || !id) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from("graphs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching graph:", error);
        return;
      }

      // Validate the graph data structure
      if (!data || !Array.isArray(data.nodes)) {
        console.error("Invalid graph data structure:", data);
        return;
      }

      // Convert nodes array to expected JSON format
      const rootNode = {
        id: "root",
        label: data.name || "Root",
        children: data.nodes.map((node: any) => ({
          id: node.id || String(Math.random()),
          label: node.label || "Node",
          position: node.position,
          children: [],
        })),
      };

      setGraphData({ ...data, json: rootNode });
      setIsLoading(false);
    }

    fetchGraph();
  }, [user, id, supabase]);

  const handleJsonChange = async (json: any) => {
    const nodes = json.children.map((node: any) => ({
      id: node.id,
      label: node.label,
      position: node.position,
    }));

    const { error } = await supabase
      .from("graphs")
      .update({ nodes })
      .eq("id", id);

    if (error) {
      console.error("Error updating graph:", error);
      return;
    }

    setGraphData((prev: any) => ({ ...prev, json }));
  };

  const handleAddNode = () => {
    graphRef.current?.addNode();
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="size-12 animate-spin" />
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <p className="text-muted-foreground">Graph not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Graph
        ref={graphRef}
        initialJson={graphData.json}
        onJsonChange={handleJsonChange}
      />
    </>
  );
}
