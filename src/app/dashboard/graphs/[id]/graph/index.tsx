"use client";

import { useCallback, useMemo } from "react";

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

  // Dynamic fitView options based on graph size
  const fitViewOptions = useMemo(() => {
    const nodeCount = nodes.length;

    // Adjust zoom based on number of nodes
    if (nodeCount <= 3) {
      return {
        padding: 0.3,        // More padding for small graphs
        maxZoom: 2.0,        // Allow zooming in more for small graphs
        minZoom: 0.8,        // Don't zoom out too much
      };
    } else if (nodeCount <= 10) {
      return {
        padding: 0.2,
        maxZoom: 1.5,
        minZoom: 0.5,
      };
    } else {
      return {
        padding: 0.1,        // Less padding for large graphs
        maxZoom: 1.0,        // Don't zoom in too much for large graphs
        minZoom: 0.2,        // Allow more zoom out for large graphs
      };
    }
  }, [nodes.length]);

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
        fitViewOptions={fitViewOptions}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
