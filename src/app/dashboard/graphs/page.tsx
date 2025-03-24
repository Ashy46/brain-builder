"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { BrainCircuit, PlusCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreateGraphDialog } from "../create-graph";

const ITEMS_PER_PAGE = 10;

export default function GraphsPage() {
  const { user } = useAuth();

  const [graphs, setGraphs] = useState<Tables<"graphs">[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGraphs() {
      if (!user) return;

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("graphs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) {
        console.error("Error fetching graphs:", error);
        return;
      }

      setGraphs(data || []);
      if (count) {
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    }

    fetchGraphs();
  }, [user, supabase, currentPage]);

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-4xl font-bold">My Graphs</h1>
        <CreateGraphDialog
          trigger={
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New Graph
            </Button>
          }
        />
      </div>

      <Card className="animate-in zoom-in-95">
        {graphs.length > 0 ? (
          <>
            <CardHeader>
              <CardTitle>All Graphs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {graphs.map((graph) => (
                  <div
                    key={graph.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-lg">{graph.name}</span>
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
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-5">
            <BrainCircuit className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No graphs created yet. Create your first graph to get started!
            </p>
            <CreateGraphDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Create New Graph
                </Button>
              }
            />
          </CardContent>
        )}
      </Card>
    </>
  );
}
