import { handleConditionalNode } from "./handle-nodes/handle-conditional-node";
import { handleAnalysisNode } from "./handle-nodes/handle-analysis-node";
import { handlePromptNode } from "./handle-nodes/handle-prompt-node";

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function traverseTree(messages: Message[], graphId: string, authToken: string) {
  const node = await handleConditionalNode(4, "d1789460-2cf8-4ec2-963f-f65655ffdea2", authToken);
  console.log("next node", node);

  let response = null;

  if (node) {
    response = await handlePromptNode(messages, node, authToken);
  }

  return response;
}

export { traverseTree };
