"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";
import { Parameters } from "@/app/dashboard/graphs/[id]/parameters";
import { Button } from "@/components/ui/button";

interface Parameter {
  id: string;
  name: string;
  value: string;
}

interface AnalysisMethod {
  id: string;
  name: string;
  type: string;
}

export default function GraphPage() {
  const { id } = useParams();
  const router = useRouter();
  const graphRef = useRef<GraphRef>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleParametersChange = (parameters: {
    patientParameters: Parameter[];
    analysisMethods: AnalysisMethod[];
  }) => {
    // TODO: Handle parameters change
    console.log("Parameters updated:", parameters);
  };

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

      <div className="absolute top-4 right-4 z-10">
        {isUpdating ? (
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        ) : (
          <Parameters onParametersChange={handleParametersChange} />
        )}
      </div>

      <Graph
        ref={graphRef}
        graphId={id as string}
        onUpdateStart={() => setIsUpdating(true)}
        onUpdateEnd={() => setIsUpdating(false)}
      />
    </>
  );
}
