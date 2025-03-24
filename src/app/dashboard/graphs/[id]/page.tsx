"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Code2 } from "lucide-react";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";
import { CodeEditor } from "@/app/dashboard/graphs/[id]/code-editor";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GraphPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const supabase = createClient();
  const graphRef = useRef<GraphRef>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonEditor, setShowJsonEditor] = useState(false);

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
      if (!data || !data.json || !data.json.id || !data.json.label) {
        console.error("Invalid graph data structure:", data);
        return;
      }

      setGraphData(data);
      setJsonInput(JSON.stringify(data.json, null, 2));
      setIsLoading(false);
    }

    fetchGraph();
  }, [user, id, supabase]);

  const handleJsonSubmit = async () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(jsonData, null, 2));

      // Update the graph in the database
      const { error } = await supabase
        .from("graphs")
        .update({ json: jsonData })
        .eq("id", id);

      if (error) {
        console.error("Error updating graph:", error);
        return;
      }

      setGraphData((prev: any) => ({ ...prev, json: jsonData }));
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  const handleJsonChange = (newJson: any) => {
    setJsonInput(JSON.stringify(newJson, null, 2));
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
    <div className="h-screen w-screen flex bg-background">
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            onClick={handleAddNode}
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm"
          >
            Add Node
          </Button>
          <Button
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm"
          >
            <Code2 className="w-4 h-4 mr-2" />
            {showJsonEditor ? "Hide JSON" : "Show JSON"}
          </Button>
        </div>
        <Graph
          ref={graphRef}
          initialJson={graphData.json}
          onJsonChange={handleJsonChange}
        />
      </div>

      {showJsonEditor && (
        <Card className="w-1/3 border-l border-border rounded-none">
          <div className="p-4 border-b border-border">
            <Button onClick={handleJsonSubmit} className="w-full">
              Apply JSON
            </Button>
          </div>
          <div className="h-[calc(100vh-4rem)]">
            <CodeEditor
              value={jsonInput}
              onChange={setJsonInput}
              language="json"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
