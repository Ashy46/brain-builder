import { forwardRef, useCallback, useState, useImperativeHandle, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  Panel,
  ReactFlowProvider,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useAuth } from "@/lib/hooks/use-auth";
import { Tables, Enums } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Import the AddNodeDialog
import { AddNodeDialog } from "./dialogs/add-node-dialog";
import { nodeTypes, NodeType } from "./nodes";
// Import our custom Controls
import { Controls as CustomControls } from "@/app/dashboard/graphs/archive/graph/controls";

export interface GraphRef {
  fitView: () => void;
  addNode: () => void;
  selectedNode: Tables<"graph_nodes"> | null;
}

// Inner component that uses React Flow hooks
const GraphInner = forwardRef<
  GraphRef, 
  { 
    graphId: string; 
    onUpdateStart: () => void; 
    onUpdateEnd: () => void 
  }
>(({ graphId, onUpdateStart, onUpdateEnd }, ref) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Tables<"graph_nodes"> | null>(null);
  const [dbNodes, setDbNodes] = useState<Tables<"graph_nodes">[]>([]);
  const [states, setStates] = useState<Tables<"graph_states">[]>([]);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Node click handler - moved before conditional logic to maintain hook order
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    // Find the corresponding database node
    const dbNode = dbNodes.find(n => n.id === node.id) || null;
    setSelectedNode(dbNode);
  }, [dbNodes, setSelectedNode]);

  // Expose methods to the parent through the ref
  useImperativeHandle(ref, () => ({
    fitView: () => {
      // Implementation of fitView
      console.log("fitView called");
    },
    addNode: () => {
      setIsAddNodeDialogOpen(true);
    },
    selectedNode,
  }));

  // Load graph nodes, edges, and states
  const loadGraph = async () => {
    setIsLoading(true);
    
    // 1. Load states first since they'll be needed for the analysis node
    const { data: statesData, error: statesError } = await supabase
      .from('graph_states')
      .select('*')
      .eq('graph_id', graphId);

    if (statesError) {
      console.error('Error loading graph states:', statesError);
      toast.error('Failed to load graph states');
      return;
    }

    setStates(statesData || []);

    // 2. Load nodes
    const { data: nodesData, error: nodesError } = await supabase
      .from('graph_nodes')
      .select('*')
      .eq('graph_id', graphId);

    if (nodesError) {
      console.error('Error loading graph nodes:', nodesError);
      toast.error('Failed to load graph nodes');
      return;
    }

    setDbNodes(nodesData || []);

    // 3. Create flow nodes including the analysis node fixed at (0,0)
    const analysisNode: Node = {
      id: `analysis-${graphId}`,
      position: { x: 0, y: 0 },
      data: {
        label: 'Graph States',
        nodeType: 'ANALYSIS',
        states: statesData || [],
      },
      type: 'analysis',
      draggable: false  // Fixed at 0,0
    };

    // Add other nodes
    const regularNodes: Node[] = nodesData.map(node => ({
      id: node.id,
      position: { x: node.pos_x, y: node.pos_y },
      data: {
        label: node.label,
        nodeType: node.node_type
      },
      type: node.node_type.toLowerCase()
    }));
    
    const flowNodes = [analysisNode, ...regularNodes];
    setNodes(flowNodes);

    // 4. Load and create edges
    const conditionalNodeIds = nodesData
      .filter(node => node.node_type === 'CONDITIONAL')
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

    const trueEdges: Edge[] = conditionalData
      .filter(node => node.true_child_id !== null)
      .map(node => ({
        id: `${node.id}-true`,
        source: node.graph_node_id,
        target: node.true_child_id as string,
        sourceHandle: 'true',
        animated: true,
        label: "True"
      }));

    const falseEdges: Edge[] = conditionalData
      .filter(node => node.false_child_id !== null)
      .map(node => ({
        id: `${node.id}-false`,
        source: node.graph_node_id,
        target: node.false_child_id as string,
        sourceHandle: 'false',
        animated: true,
        label: "False"
      }));

    setEdges([...trueEdges, ...falseEdges]);
    setIsLoading(false);
  };

  // Handle node changes (position, selection, etc.)
  const onNodesChangeCallback = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      onUpdateStart();
      
      // Handle position updates with debouncing
      const nodeChanges = changes.filter(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (nodeChanges.length > 0) {
        updateNodePositions(nodeChanges);
      }
    },
    [onNodesChange, onUpdateStart]
  );
  
  // Update node positions in the database
  const updateNodePositions = async (changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type !== 'position' || !change.position) continue;
      
      const { id, position } = change;
      
      // Skip the analysis node which is fixed at 0,0
      if (id === `analysis-${graphId}`) continue;
      
      await supabase
        .from('graph_nodes')
        .update({
          pos_x: position.x,
          pos_y: position.y
        })
        .eq('id', id);
    }
    
    onUpdateEnd();
  };

  // Handle edge changes
  const onEdgesChangeCallback = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      // Handle edge updates here
      onUpdateEnd();
    },
    [onEdgesChange, onUpdateEnd]
  );

  // Handle node connection
  const onConnect = useCallback(
    async (params: Connection) => {
      // Prevent duplicate edges
      const edgeExists = edges.some(
        (edge) => edge.source === params.source && edge.target === params.target
      );

      if (edgeExists) return;

      // Find source node to determine what type of edge to create
      const sourceNode = nodes.find(node => node.id === params.source);
      if (!sourceNode) return;

      // Create temporary edge for UI feedback
      const newEdge: Edge = {
        id: `temp-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        animated: true,
        label: params.sourceHandle === 'true' ? 'True' : 
               params.sourceHandle === 'false' ? 'False' : undefined
      };

      setEdges(prev => [...prev, newEdge]);

      // Save edge to the database based on node type
      if (sourceNode.type === 'conditional') {
        const updates: any = {};
        if (params.sourceHandle === 'true') {
          updates.true_child_id = params.target;
        } else if (params.sourceHandle === 'false') {
          updates.false_child_id = params.target;
        }

        // Update the conditional node in the database
        const { error } = await supabase
          .from('graph_conditional_nodes')
          .update(updates)
          .eq('graph_node_id', params.source);

        if (error) {
          console.error('Error creating edge:', error);
          setEdges(prev => prev.filter(e => e.id !== newEdge.id));
          return;
        }
      }
      
      onUpdateEnd();
    },
    [nodes, edges, setEdges, onUpdateEnd]
  );

  // Handle adding a new node
  const handleAddNode = useCallback(
    async (type: NodeType, label: string, config?: any) => {
      const position = { x: 100, y: 100 }; // Default position or calculate based on existing nodes
      
      // Create the node in the database
      const { data: newNode, error } = await supabase
        .from('graph_nodes')
        .insert({
          graph_id: graphId,
          label,
          node_type: type.toUpperCase() as Enums<"node_type">,
          pos_x: position.x,
          pos_y: position.y
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating node:', error);
        toast.error('Failed to create node');
        return;
      }
      
      // Add the node to the UI
      setNodes(nodes => [
        ...nodes, 
        {
          id: newNode.id,
          position,
          data: {
            label: newNode.label,
            nodeType: newNode.node_type,
            ...config
          },
          type: newNode.node_type.toLowerCase()
        }
      ]);
      
      // If it's a conditional node, create the additional data
      if (type.toUpperCase() === 'CONDITIONAL' && config) {
        const { error: conditionalError } = await supabase
          .from('graph_conditional_nodes')
          .insert({
            graph_node_id: newNode.id,
            operator: 'AND'
          });
          
        if (conditionalError) {
          console.error('Error creating conditional node data:', conditionalError);
          return;
        }
        
        // Add conditional node condition
        if (config.stateId && config.operator) {
          const { error: conditionError } = await supabase
            .from('graph_conditional_node_conditions')
            .insert({
              graph_conditional_node_id: newNode.id,
              state_id: config.stateId,
              conditional_operator: config.operator,
              value: config.value || null
            });
            
          if (conditionError) {
            console.error('Error creating condition:', conditionError);
          }
        }
      }
      
      // If it's a prompt node, create the prompt node association
      if (type.toUpperCase() === 'PROMPT' && config && config.promptId) {
        const { error: promptNodeError } = await supabase
          .from('graph_prompt_nodes')
          .insert({
            graph_node_id: newNode.id,
            prompt_id: config.promptId
          });
          
        if (promptNodeError) {
          console.error('Error creating prompt node data:', promptNodeError);
        }
      }
      
      toast.success(`${type} node created successfully`);
    },
    [graphId, setNodes]
  );

  // Delete a node
  const deleteNode = useCallback(
    async (nodeId: string) => {
      // Check if it's an analysis node
      if (nodeId === `analysis-${graphId}`) {
        toast.error("Cannot delete the analysis node");
        return;
      }
      
      // Remove from UI first
      setNodes(nodes => nodes.filter(node => node.id !== nodeId));
      setEdges(edges => edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
      
      // Delete from database
      const { error } = await supabase
        .from('graph_nodes')
        .delete()
        .eq('id', nodeId);
        
      if (error) {
        console.error('Error deleting node:', error);
        toast.error('Failed to delete node');
        loadGraph(); // reload to get correct state
        return;
      }
      
      // Clear selection if deleted node was selected
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [graphId, selectedNode, setNodes, setEdges, setSelectedNode]
  );

  // Load graph on component mount
  useEffect(() => {
    loadGraph();
  }, [graphId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeCallback}
        onEdgesChange={onEdgesChangeCallback}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Panel position="top-left">
          <button 
            onClick={() => setIsAddNodeDialogOpen(true)}
            className="bg-white dark:bg-gray-800 rounded p-2 shadow"
          >
            Add Node
          </button>
        </Panel>
        
        <CustomControls />
      </ReactFlow>

      {/* Use the AddNodeDialog component */}
      <AddNodeDialog
        open={isAddNodeDialogOpen}
        onOpenChange={setIsAddNodeDialogOpen}
        onAddNode={handleAddNode}
        graphId={graphId}
        isRootNode={nodes.filter(n => !n.id.toString().startsWith('analysis-')).length <= 1}
      />
    </div>
  );
});

// Wrapper component that provides the ReactFlowProvider
export const Graph = forwardRef<GraphRef, { 
  graphId: string; 
  onUpdateStart: () => void; 
  onUpdateEnd: () => void 
}>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});
