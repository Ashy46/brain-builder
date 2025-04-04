import { forwardRef, useState, useEffect, memo, useImperativeHandle } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AddNodeDialog } from "./dialogs";
import { nodeTypes } from "./nodes";
import { FlowProps, GraphRef } from "./types";

// Create a separate inner component to use the useReactFlow hook
const GraphContentInner = memo(forwardRef<GraphRef, FlowProps>((props, ref) => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    onNodeClick, 
    onInit, 
    selectedNode, 
    setSelectedNode, 
    handleAddNode, 
    isAddNodeDialogOpen, 
    setIsAddNodeDialogOpen, 
    isRootNode 
  } = props;

  // Initialize ReactFlow hooks
  const reactFlowInstance = useReactFlow();

  // Use the useImperativeHandle hook to customize the ref behavior
  useImperativeHandle(ref, () => ({
    fitView: () => {
      // This will be called by the parent through the ref
      console.log("fitView called via ref");
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    },
    addNode: () => {
      // This will be called by the parent through the ref
      setIsAddNodeDialogOpen(true);
    },
    selectedNode,
  }));

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        nodeTypes={nodeTypes}
        onInit={onInit}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left">
          <button 
            onClick={() => setIsAddNodeDialogOpen(true)}
            className="bg-white rounded p-2 shadow"
          >
            Add Node
          </button>
        </Panel>
      </ReactFlow>

      {/* Node creation dialog */}
      <AddNodeDialog
        open={isAddNodeDialogOpen}
        onOpenChange={setIsAddNodeDialogOpen}
        onAddNode={handleAddNode}
        isRootNode={isRootNode}
        hasAnalysisNode={nodes.some(node => node.type === 'analysis')}
      />
    </div>
  );
}));

// Wrapper component that provides the ReactFlowProvider
export const GraphContent = memo(forwardRef<GraphRef, FlowProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GraphContentInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
}));

GraphContent.displayName = "GraphContent";
GraphContentInner.displayName = "GraphContentInner";
