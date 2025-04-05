"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  BrainCircuit,
  PlusCircle,
  Loader2,
  Trash2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

import { CreatePromptDialog } from "./create-prompt-dialog";
import { EditPromptDialog } from "./edit-prompt-dialog";
import { SearchForPromptsDialog } from "./search-for-prompts-dialog";

const PAGE_SIZE = 10;

export default function PromptsPage() {
  const { user } = useAuth();

  const [prompts, setPrompts] = useState<Tables<"user_prompts">[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] =
    useState<Tables<"user_prompts"> | null>(null);

  const fetchPrompts = async () => {
    if (!user) return;

    setIsLoading(true);

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const supabase = createClient();

    const { data, error, count } = await supabase
      .from("user_prompts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error("Error fetching prompts:", error);
      return;
    }

    setPrompts(data || []);
    if (count) {
      setTotalPages(Math.ceil(count / PAGE_SIZE));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrompts();
  }, [user, currentPage]);

  const handleDelete = async () => {
    if (!promptToDelete) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("user_prompts")
      .delete()
      .eq("id", promptToDelete.id)
      .eq("user_id", user?.id);

    if (error) console.error("Error deleting prompt:", error);

    setPrompts((prev) => prev.filter((p) => p.id !== promptToDelete.id));
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  return isLoading ? (
    <Loader2 className="size-12 animate-spin" />
  ) : (
    <>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-4xl font-bold">My Prompts</h1>
        <div className="flex items-center gap-2">
          <SearchForPromptsDialog
            trigger={
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search for Prompts
              </Button>
            }
          />
          <CreatePromptDialog
            trigger={
              <Button className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                New Prompt
              </Button>
            }
            onPromptCreated={fetchPrompts}
          />
        </div>
      </div>

      <Card className="animate-in fade-in zoom-in-95">
        {prompts.length > 0 ? (
          <>
            <CardHeader>
              <CardTitle>All Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">
                          {prompt.description || "Untitled Prompt"}
                        </span>
                        <Badge
                          variant={prompt.public ? "default" : "secondary"}
                        >
                          {prompt.public ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Created{" "}
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EditPromptDialog
                        prompt={prompt}
                        trigger={<Button variant="outline">Edit Prompt</Button>}
                        onPromptUpdated={fetchPrompts}
                      />
                      <Dialog
                        open={
                          deleteDialogOpen && promptToDelete?.id === prompt.id
                        }
                        onOpenChange={setDeleteDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setPromptToDelete(prompt)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Prompt</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this prompt? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDeleteDialogOpen(false);
                                setPromptToDelete(null);
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
              No prompts created yet. Create your first prompt to get started!
            </p>
            <CreatePromptDialog
              trigger={
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Create New Prompt
                </Button>
              }
              onPromptCreated={fetchPrompts}
            />
          </CardContent>
        )}
      </Card>
    </>
  );
}
