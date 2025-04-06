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
import { NodeType } from "@/components/graph/nodes";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/supabase";
export default function GraphPage() {
  const router = useRouter();
  const { id } = useParams();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isManageStatesOpen, setIsManageStatesOpen] = useState(false);
  const [isTestChatOpen, setIsTestChatOpen] = useState(false);

  const graphRef = useRef<GraphRef>(null);

  const onAddNode = async (type: string, label: string, config: any) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_nodes")
      .insert({
        graph_id: id as string,
        label: label,
        pos_x: 0,
        pos_y: 0,
        node_type: type === "prompt" ? "PROMPT" : type === "conditional" ? "CONDITIONAL" : type.toUpperCase() as Tables<'graph_nodes'>['node_type'],
      })
      .select();

    if (type === "conditional" && data && data.length > 0) {
      const { data: conditionalData, error: conditionalError } = await supabase
        .from("graph_conditional_nodes")
        .insert({
          graph_node_id: data[0].id
        });

      const { data: conditionalDataConditions, error: conditionalDataConditionsError } = await supabase
        .from("graph_conditional_conditions")
        .insert({
          graph_conditional_node_id: data[0].id,
          conditional_operator: config.operator,
          value: config.value,
          state_id: config.stateId,
        });

      if (conditionalDataConditionsError) {
        console.error(conditionalDataConditionsError);
      }

      if (conditionalError) {
        console.error(conditionalError);
      }
    }
    if (type === "prompt" && data && data.length > 0) {
      const { data: promptData, error: promptError } = await supabase
        .from("graph_prompt_nodes")
        .insert({
          graph_node_id: data[0].id,
          prompt_id: config.promptId,
        });

      if (promptError) {
        console.error(promptError);
      }
    }
  }

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
