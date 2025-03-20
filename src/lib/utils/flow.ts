import { Node, Edge, XYPosition } from "@xyflow/react";

import { JsonNode } from "@/types/flow";

const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 200;

function calculateNodePositions(
  jsonNode: JsonNode,
  startPosition: XYPosition,
  level: number = 0
): { nodes: Node[]; edges: Edge[]; width: number } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const currentNode: Node = {
    id: jsonNode.id,
    position: startPosition,
    data: { label: jsonNode.label },
    type: level === 0 ? "input" : "default",
  };
  nodes.push(currentNode);

  if (!jsonNode.children || jsonNode.children.length === 0) {
    return { nodes, edges, width: 0 };
  }

  const children = jsonNode.children;
  const childResults = children.map((child, index) => {
    const childStartX =
      startPosition.x -
      (HORIZONTAL_SPACING * (children.length - 1)) / 2 +
      HORIZONTAL_SPACING * index;
    const childStartY = startPosition.y + VERTICAL_SPACING;

    return calculateNodePositions(
      child,
      { x: childStartX, y: childStartY },
      level + 1
    );
  });

  childResults.forEach((result, index) => {
    nodes.push(...result.nodes);
    edges.push(...result.edges);

    edges.push({
      id: `${jsonNode.id}-${children[index].id}`,
      source: jsonNode.id,
      target: children[index].id,
    });
  });

  const totalWidth = Math.max(
    ...childResults.map((result) => result.width),
    HORIZONTAL_SPACING * (children.length - 1)
  );

  return { nodes, edges, width: totalWidth };
}

export function convertJsonToFlow(jsonNode: JsonNode): {
  nodes: Node[];
  edges: Edge[];
} {
  const startPosition = { x: 0, y: 0 };
  const result = calculateNodePositions(jsonNode, startPosition);
  return { nodes: result.nodes, edges: result.edges };
}
