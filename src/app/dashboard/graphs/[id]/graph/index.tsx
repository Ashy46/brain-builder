"use client";

import { useCallback } from "react";

import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Controls } from "./controls";
import { AnalysisNode } from "../nodes/analysis-node";
import { PromptNode } from "../nodes/prompt-node";
import { ConditionalNode } from "../nodes/conditional-node";
import { useGraphData } from "./hook";
import { createNodeChangeHandler } from "./node-handlers";
import {
  createEdgeChangeHandler,
  createConnectionHandler,
} from "./edge-handlers";

const nodeTypes = {
  analysis: AnalysisNode,
  prompt: PromptNode,
  conditional: ConditionalNode,
};

export function Graph() {
  const { nodes, setNodes, edges, setEdges, graphId, setRefresh, removeEdges } =
    useGraphData();

  const onNodesChange = useCallback(
    createNodeChangeHandler(setNodes, removeEdges),
    [setNodes, removeEdges]
  );

  const onEdgesChange = useCallback(
    createEdgeChangeHandler(setEdges, edges, graphId),
    [setEdges, edges, graphId]
  );

  const onConnect = useCallback(
    createConnectionHandler(setEdges, edges, graphId, nodes, setRefresh),
    [setEdges, edges, graphId, nodes, setRefresh]
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        key={nodes.length}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
