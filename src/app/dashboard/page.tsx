"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PlusCircle, BrainCircuit } from "lucide-react";

import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateGraphDialog } from "./create-graph";

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

      <div className="grid gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Total Graphs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{graphs.length}</p>
            </CardContent>
          </Card>

          <Card className="animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateGraphDialog
                trigger={
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Create New Graph
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        <Card className="animate-in zoom-in-95">
          {graphs.length > 0 ? (
            <>
              <CardHeader>
                <CardTitle>Recent Graphs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {graphs.map((graph) => (
                    <div
                      key={graph.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">
                          {graph.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Created{" "}
                          {new Date(graph.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Link href={`/graphs/${graph.id}`}>
                        <Button variant="outline">View Graph</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-5">
              <BrainCircuit className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No graphs created yet. Create your first graph to get started!
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
