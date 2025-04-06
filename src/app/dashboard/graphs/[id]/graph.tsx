import { forwardRef, useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  Controls
} from "@xyflow/react";

import { useAuth } from "@/lib/hooks/use-auth";

import { Tables } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";

export interface GraphRef {
  fitView: () => void;
  addNode: () => void;
  selectedNode: Tables<"graph_nodes"> | null;
}

export const Graph = forwardRef<
  GraphRef,
  { graphId: string; onUpdateStart: () => void; onUpdateEnd: () => void }
>(({ graphId, onUpdateStart, onUpdateEnd }, ref) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [dbNodes, setDbNodes] = useState<Tables<"graph_nodes">[]>([]);

  // Use any type temporarily to bypass typing issues
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  const loadGraph = async () => {
    const { data, error } = await supabase
      .from('graph_nodes')
      .select('*')
      .eq('graph_id', graphId);

    if (error) {
      console.error('Error loading graph nodes:', error);
      return;
    }

    setDbNodes(data);

    // Transform database nodes to ReactFlow nodes
    const flowNodes = data.map(node => ({
      id: node.id,
      position: { x: node.pos_x, y: node.pos_y },
      data: {
        label: node.label,
        nodeType: node.node_type
      },
      type: node.node_type.toLowerCase()
    }));

    setNodes(flowNodes);

    // Filter nodes of type CONDITIONAL
    const conditionalNodeIds = data
      .filter(node => node.node_type === 'conditional')
      .map(node => node.id);

    let conditionalData: Tables<"graph_conditional_nodes">[] = [];

    if (conditionalNodeIds.length > 0) {
      const { data: conditionals, error: conditionalNodesError } = await supabase
        .from('graph_conditional_nodes')
        .select('*')
        .in('graph_node_id', conditionalNodeIds);

      if (conditionalNodesError) {
        console.error('Error loading conditional nodes:', conditionalNodesError);
        return;
      }

      conditionalData = conditionals || [];
    }

    // Set the edges based on the conditional nodes true and false edges
    const trueEdges = conditionalData
      .filter(node => node.true_child_id !== null)
      .map(node => ({
        id: `${node.id}`,
        source: node.graph_node_id,
        target: node.true_child_id as string,
        animated: true,
        label: "True"
      }));

    const falseEdges = conditionalData
      .filter(node => node.false_child_id !== null)
      .map(node => ({
        id: `${node.id}`,
        source: node.graph_node_id,
        target: node.false_child_id as string,
        animated: true,
        label: "False"
      }));

    setEdges([...trueEdges, ...falseEdges]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          onUpdateStart();
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          onUpdateEnd();
        }}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
});
