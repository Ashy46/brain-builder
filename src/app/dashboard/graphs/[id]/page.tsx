"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Graph, GraphRef } from "@/app/dashboard/graphs/[id]/graph";
import { Parameters } from "@/app/dashboard/graphs/[id]/parameters";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { toast } from "sonner";

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
  const [initialParameters, setInitialParameters] = useState<{
    patientParameters: Parameter[];
    analysisMethods: AnalysisMethod[];
  } | null>(null);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchParameters() {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from("graphs")
          .select("patient_params, analysis_methods")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        // Convert database format back to component format
        const patientParameters: Parameter[] = (data.patient_params || []).map((param: string, index: number) => {
          const [name, value] = param.split(":");
          return {
            id: index.toString(),
            name: name || "",
            value: value || "",
          };
        });

        const analysisMethods: AnalysisMethod[] = (data.analysis_methods || []).map((method: string, index: number) => {
          const [name, type] = method.split(":");
          return {
            id: index.toString(),
            name: name || "",
            type: type || "standard",
          };
        });

        setInitialParameters({
          patientParameters: patientParameters.length > 0 ? patientParameters : [
            { id: "1", name: "Age", value: "" },
            { id: "2", name: "Gender", value: "male" },
          ],
          analysisMethods: analysisMethods.length > 0 ? analysisMethods : [
            { id: "1", name: "Standard Analysis", type: "standard" },
          ],
        });
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Failed to load parameters");
      }
    }

    fetchParameters();
  }, [user, id, supabase]);

  const handleParametersChange = async (parameters: {
    patientParameters: Parameter[];
    analysisMethods: AnalysisMethod[];
  }) => {
    if (!user || !id) return;

    try {
      setIsUpdating(true);

      // Convert parameters to the format expected by the database
      const patientParams = parameters.patientParameters.map(
        param => `${param.name}:${param.value}`
      );

      const analysisMethods = parameters.analysisMethods.map(
        method => `${method.name}:${method.type}`
      );

      // Update the database
      const { error } = await supabase
        .from("graphs")
        .update({
          patient_params: patientParams,
          analysis_methods: analysisMethods,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating parameters:", error);
      toast.error("Failed to update parameters");
    } finally {
      setIsUpdating(false);
    }
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
          initialParameters && (
            <Parameters
              initialParameters={initialParameters}
              onParametersChange={handleParametersChange}
            />
          )
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
