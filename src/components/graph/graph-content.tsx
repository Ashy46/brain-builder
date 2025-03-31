import { forwardRef, useImperativeHandle } from "react";
import { ReactFlow, Background, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Controls } from "./controls";
import { AddNodeDialog } from "./dialogs";
import { nodeTypes } from "./nodes";
import { FlowProps, GraphRef } from "./types";

export const GraphContent = forwardRef<GraphRef, FlowProps>(
  (
    {
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
      isRootNode,
    },
    ref
  ) => {
    const { fitView } = useReactFlow();

    useImperativeHandle(ref, () => ({
      fitView: () => {
        fitView();
      },
      addNode: () => {
        setIsAddNodeDialogOpen(true);
      },
      selectedNode,
    }));

    return (
      <>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onInit={onInit}
        >
          <Background />
          <Controls />
        </ReactFlow>
        <AddNodeDialog
          open={isAddNodeDialogOpen}
          onOpenChange={setIsAddNodeDialogOpen}
          onAddNode={handleAddNode}
          isRootNode={isRootNode}
          hasAnalysisNode={nodes.some((node) => node.type === "analysis")}
        />
      </>
    );
  }
);

GraphContent.displayName = "GraphContent";
