"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateGraphDialogProps {
  trigger?: React.ReactNode;
}

export function CreateGraphDialog({ trigger }: CreateGraphDialogProps) {
  const router = useRouter();

  const { user } = useAuth();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Create the graph without any child nodes initially
      const { data: graphData, error: graphError } = await supabase
        .from("graphs")
        .insert([
          {
            name,
            user_id: user.id,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (graphError) throw graphError;

      // In our new architecture, we don't create an analysis node
      // Analysis node is virtual and created on the client side
      // We'll let the graph component handle this when it loads

      setOpen(false);
      router.push(`/dashboard/graphs/${graphData.id}`);
    } catch (error) {
      console.error("Failed to create graph:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create New Graph</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Graph</DialogTitle>
            <DialogDescription>
              Give your new graph a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter graph name"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Graph"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
