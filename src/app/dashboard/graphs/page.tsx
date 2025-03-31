"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { BrainCircuit, PlusCircle, Loader2, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateGraphDialog } from "../../../components/graph/dialog/create-graph-dialog";

const PAGE_SIZE = 10;

export default function GraphsPage() {
  const { user } = useAuth();

  const [graphs, setGraphs] = useState<Tables<"graphs">[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState<Tables<"graphs"> | null>(
    null
  );

  useEffect(() => {
    async function fetchGraphs() {
      if (!user) return;

      setIsLoading(true);

      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const supabase = createClient();

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
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      }
      setIsLoading(false);
    }

    fetchGraphs();
  }, [user, currentPage]);

  const handleDelete = async () => {
    if (!graphToDelete) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("graphs")
      .delete()
      .eq("id", graphToDelete.id)
      .eq("user_id", user?.id);

    if (error) console.error("Error deleting graph:", error);

    setGraphs((prev) => prev.filter((g) => g.id !== graphToDelete.id));
    setDeleteDialogOpen(false);
    setGraphToDelete(null);
  };

  return isLoading ? (
    <Loader2 className="size-12 animate-spin" />
  ) : (
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

      <Card className="animate-in fade-in zoom-in-95">
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
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/graphs/${graph.id}`}>
                        <Button variant="outline">View Graph</Button>
                      </Link>
                      <Dialog
                        open={
                          deleteDialogOpen && graphToDelete?.id === graph.id
                        }
                        onOpenChange={setDeleteDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setGraphToDelete(graph)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Graph</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{graph.name}"?
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDeleteDialogOpen(false);
                                setGraphToDelete(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
