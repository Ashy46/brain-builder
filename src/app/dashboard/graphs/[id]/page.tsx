"use client";

import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";
import { Button } from "@/components/ui/button";

export default function GraphPage() {
  const { id } = useParams();
  const router = useRouter();

  const graphRef = useRef<GraphRef>(null);

  if (!id) {
    return null;
  }

  return (
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

      <Graph ref={graphRef} graphId={id as string} />
    </>
  );
}
