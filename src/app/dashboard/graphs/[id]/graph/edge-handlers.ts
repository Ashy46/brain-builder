import {
  Edge,
  EdgeChange,
  Connection,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

import { updateGraphConnection, updateConditionalConnection } from "./database";

export function createEdgeChangeHandler(
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  edges: Edge[],
  graphId: string
) {
  return async (changes: EdgeChange[]) => {
    console.log("Edge changes:", changes);

    // Handle edge deletions first to update the database
    for (const change of changes) {
      if (change.type === "remove") {
        console.log("Removing edge:", change);

        // Find the edge that's being removed
        const edgeToRemove = edges.find((e) => e.id === change.id);

        if (edgeToRemove) {
          console.log("Found edge to remove:", edgeToRemove);

          // Check if this is a conditional node edge
          if (
            edgeToRemove.sourceHandle === "true" ||
            edgeToRemove.sourceHandle === "false"
          ) {
            console.log("Removing conditional edge connection:", edgeToRemove);

            // Update the conditional node to remove the connection
            const isTrue = edgeToRemove.sourceHandle === "true";
            await updateConditionalConnection(
              edgeToRemove.source,
              isTrue,
              null
            );
          } else if (edgeToRemove.source === "1") {
            // If this is the main graph connection, update the graph
            await updateGraphConnection(graphId, null);
          }
        }
      }
    }

    // Then apply all changes to the state
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);
      return updatedEdges;
    });
  };
}

export function createConnectionHandler(
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  edges: Edge[],
  graphId: string,
  nodes: any[],
  setRefresh: (refresh: boolean) => void
) {
  return async (connection: Connection) => {
    console.log("New connection:", connection);
    console.log("Source handle:", connection.sourceHandle);

    if (connection.source !== "1" && !connection.sourceHandle) {
      console.error("Missing sourceHandle for connection", connection);
      return;
    }

    // Add edge to state
    const newEdge = addEdge(connection, edges);
    setEdges(newEdge);

    // Update database based on connection type
    if (connection.source === "1") {
      // Main graph connection
      await updateGraphConnection(graphId, connection.target);
    } else {
      // Check if this is a conditional node
      const sourceNode = nodes.find((node) => node.id === connection.source);
      if (sourceNode?.type === "conditional") {
        console.log("Updating conditional connection:", connection);
        const isTrue = connection.sourceHandle === "true";
        await updateConditionalConnection(
          connection.source,
          isTrue,
          connection.target
        );
      }
    }

    // Refresh the graph to ensure all connections are properly loaded
    setRefresh(true);
  };
}
