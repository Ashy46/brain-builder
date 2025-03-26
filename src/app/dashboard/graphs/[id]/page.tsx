"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";

import { Button } from "@/components/ui/button";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";

export default function GraphPage() {
  const router = useRouter();
  const { id } = useParams();

  const { user } = useAuth();

  const supabase = createClient();

  const [isUpdating, setIsUpdating] = useState(false);

  const graphRef = useRef<GraphRef>(null);

  return !id ? null : (
    <>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => graphRef.current?.addNode()}
          title="Add a new node to the graph"
        >
          Add Node
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
    </>
  );
}
