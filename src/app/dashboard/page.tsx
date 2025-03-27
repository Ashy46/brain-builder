"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PlusCircle, BrainCircuit, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGraphDialog } from "./create-graph";

export default function DashboardPage() {
  const { user } = useAuth();
  const [graphs, setGraphs] = useState<Tables<"graphs">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGraphs() {
      if (!user) return;
      setIsLoading(true);

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
      setIsLoading(false);
    }

    fetchGraphs();
  }, [user, supabase]);

  return isLoading ? (
    <Loader2 className="size-12 animate-spin" />
  ) : (
    <>
      <h1 className="text-4xl font-bold mb-5">Dashboard</h1>

      <div className="grid gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-in fade-in zoom-in-95">
            <CardHeader>
              <CardTitle>Total Graphs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{graphs.length}</p>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in zoom-in-95">
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

        <Card className="animate-in fade-in zoom-in-95">
          {isLoading ? (
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : graphs.length > 0 ? (
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
                      <Link href={`/dashboard/graphs/${graph.id}`}>
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
