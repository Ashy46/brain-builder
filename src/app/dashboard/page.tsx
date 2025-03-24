"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Tables } from "@/types/supabase";

export default function DashboardPage() {
  const { user } = useAuth();
  const [graphs, setGraphs] = useState<Tables<"graphs">[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGraphs() {
      if (!user) return;

      const { data, error } = await supabase
        .from("graphs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching graphs:", error);
        return;
      }

      setGraphs(data || []);
    }

    fetchGraphs();
  }, [user, supabase]);

  return (
    <>
      <h1 className="text-4xl font-bold mb-5">Dashboard</h1>

      <div className="grid gap-6">
        {/* Top Row - 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Graphs</h3>
            <p className="text-3xl font-bold">{graphs.length}</p>
          </Card>

          {/* Create New Graph Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <Link href="/graphs/new" className="w-full">
                <Button size="lg" className="w-full flex items-center justify-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Create New Graph
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Graphs Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Graphs</h2>
          {graphs.length > 0 ? (
            <div className="space-y-4">
              {graphs.map((graph) => (
                <div 
                  key={graph.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-lg">{graph.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(graph.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Link href={`/graphs/${graph.id}`}>
                    <Button variant="outline">View Graph</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No graphs created yet. Create your first graph to get started!</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
