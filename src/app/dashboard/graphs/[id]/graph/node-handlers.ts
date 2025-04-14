import { Node, NodeChange, applyNodeChanges } from "@xyflow/react";
import { debounce } from "lodash";

import {
  updateNodePositionInDatabase,
  deleteNodeFromDatabase,
} from "./database";

// Create a debounced version of the updateNodePositionInDatabase function
export const debouncedUpdateNodePosition = debounce(
  updateNodePositionInDatabase,
  300
);

export function createNodeChangeHandler(
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  removeEdges: (nodeId: string) => void
) {
  return async (changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);

      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          const movedNode = updatedNodes.find((node) => node.id === change.id);

          if (movedNode) {
            debouncedUpdateNodePosition(movedNode.id, movedNode.position);
          }
        } else if (change.type === "remove") {
          if (change.id !== "1") {
            // Don't delete the start node
            deleteNodeFromDatabase(change.id);
          }

          // Remove any edges connected to this node
          removeEdges(change.id);
        }
      });

      return updatedNodes;
    });
  };
}
