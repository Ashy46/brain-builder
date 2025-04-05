"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ChevronLeft,
  Loader2,
  Plus,
  Settings,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ManageStatesDialog } from "@/components/graph/dialogs";

import { GraphRef, Graph } from "./graph";

export default function GraphPage() {
  const router = useRouter();
  const { id } = useParams();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isManageStatesOpen, setIsManageStatesOpen] = useState(false);
  const [isTestChatOpen, setIsTestChatOpen] = useState(false);

  const graphRef = useRef<GraphRef>(null);

  return !id ? null : (
    <>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => graphRef.current?.addNode()}
          title="Add a new node to the graph"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Node
        </Button>
        <Button variant="outline" onClick={() => setIsManageStatesOpen(true)}>
          <Settings className="h-4 w-4" />
          Manage States
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsTestChatOpen(!isTestChatOpen)}
        >
          <MessageSquare className="h-4 w-4" />
          Test
        </Button>
      </div>

      {isUpdating && (
        <div className="absolute top-4 right-4 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      )}

      <Graph
        ref={graphRef}
        graphId={id as string}
        onUpdateStart={() => setIsUpdating(true)}
        onUpdateEnd={() => setIsUpdating(false)}
      />

      <ManageStatesDialog
        open={isManageStatesOpen}
        onOpenChange={setIsManageStatesOpen}
        graphId={id as string}
      />
    </>
  );
}
