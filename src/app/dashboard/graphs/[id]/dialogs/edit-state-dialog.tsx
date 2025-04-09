import { Tables } from "@/types/supabase";

import { Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function EditStateDialog({ state }: { state: Tables<"graph_states"> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit State</DialogTitle>
          <DialogDescription>Edit the state of the graph.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
