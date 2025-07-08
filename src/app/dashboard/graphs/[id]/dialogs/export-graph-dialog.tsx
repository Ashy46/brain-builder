import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";

import { useGraph } from "../context/graph-context";
import { createClient } from "@/lib/supabase/client";

type ModelSettings = {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

type ExportGraphPrompt = {
  name: string;
  model_settings: ModelSettings;
  prompt: string;
}

type ExportGraphState = {
  name: string;
  type: string;
  persistent: boolean;
  prompt: ExportGraphPrompt;
}

type ConditionalsData = {
  state_name: string;
  conditional_operator: string;
  value: string;
}

type ConditionalNodeData = {
  conditional_evaluator: string;
  conditionals: ConditionalsData[];
}

type ExportGraphTreeNode = {
  name: string;
  node_type: string;
  node_data: ConditionalNodeData | ExportGraphPrompt | null;
  children: ExportGraphTreeNode[] | null;
}

type ExportGraphResult = {
  states: ExportGraphState[];
  tree: ExportGraphTreeNode;
};

export default function ExportGraphDialog() {
  const [open, setOpen] = useState(false);
  const { graphId } = useGraph();

  const handleExport = async () => {
    const result = await exportGraph(graphId);
    console.log(result);
    // TODO: Implement actual export functionality
    // toast.success("Export functionality coming soon!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background/50 hover:bg-accent/50 backdrop-blur-md">
          <Download className="h-4 w-4" />
          Export Graph
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Graph</DialogTitle>
          <DialogDescription>
            Export your graph as JSON for backup or sharing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will export your graph structure including all nodes, edges, and configurations as a JSON file.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function exportGraph(graphId: string) {
  const finalResult: ExportGraphResult = {
    states: [],
    tree: {
      name: "",
      node_type: "",
      node_data: null,
      children: null,
    },
  };

  const supabase = createClient();
  const { data, error } = await supabase.from("graphs").select("*").eq("id", graphId);

  if (error) {
    console.error(error);
  }

  //lets get all the states with their associated prompts
  const { data: states, error: statesError } = await supabase
    .from("graph_states")
    .select(`
      *,
      user_prompts (
        content,
        llm_model,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
        description
      )
    `)
    .eq("graph_id", graphId)

  if (statesError) {
    console.error(statesError);
  }

  finalResult.states = (states || []).map((state) => ({
    name: state.name,
    type: state.type,
    persistent: state.persistent,
    prompt: {
      name: state.user_prompts?.description || "",
      model_settings: {
        model: state.user_prompts?.llm_model || "gpt-4",
        temperature: state.user_prompts?.temperature || 0.7,
        max_tokens: state.user_prompts?.max_tokens || 1000,
        top_p: state.user_prompts?.top_p || 1,
        frequency_penalty: state.user_prompts?.frequency_penalty || 0,
        presence_penalty: state.user_prompts?.presence_penalty || 0,
      },
      prompt: state.user_prompts?.content || "",
    },
  }));

  console.log(finalResult);

  //Lets now get the tree and the nodes associated with the tree
  //Gather all teh nodes from the graph_nodes table
  const { data: nodes, error: nodesError } = await supabase
    .from("graph_nodes")
    .select("*")
    .eq("graph_id", graphId)

  if (nodesError) {
    console.error(nodesError);
  }

  const { data: firstNode, error: firstNodeError } = await supabase
    .from("graphs")
    .select("child_node_id")
    .eq("id", graphId)

  if (firstNodeError) {
    console.error(firstNodeError);
  }

  const firstNodeId = firstNode?.[0]?.child_node_id;

  const firstNodeData = nodes?.find((node) => node.id === firstNodeId);

  finalResult.tree = {
    name: firstNodeData?.label || "",
    node_type: firstNodeData?.node_type || "",
    node_data: null,
    children: null,
  }

  //Okay, now in DFS style, we need to get the children of the first node and so forth
  //Lets start with getting the data for the first node, and then the children
  const getNodeData = async (node: any) => {
    const nodeType = node.node_type;
    if (nodeType === "CONDITIONAL") {
      const { data: conditionalNode, error: conditionalNodeError } = await supabase
        .from("graph_conditional_nodes")
        .select("*")
        .eq("graph_node_id", node.id)

      if (conditionalNodeError) {
        console.error(conditionalNodeError);
      }

      const nodeData: ConditionalNodeData = {
        conditional_evaluator: conditionalNode?.[0]?.conditional_evaluator || "",
        conditionals: [],
      }

      const { data: conditionals, error: conditionalsError } = await supabase
        .from("graph_conditional_node_conditions")
        .select("*, graph_states (name)")
        .eq("graph_conditional_node_id", conditionalNode?.[0]?.id)

      if (conditionalsError) {
        console.error(conditionalsError);
      }

      console.log("Conditionals: ", conditionals);

      nodeData.conditionals = conditionals?.map((conditional) => ({
        state_name: conditional.graph_states?.name,
        conditional_operator: conditional.conditional_operator,
        value: conditional.value,
      })) || [];

      console.log("Node Data: ", nodeData);

      return nodeData;
    } else if (nodeType === "PROMPT") {
      const { data: promptNode, error: promptNodeError } = await supabase
        .from("graph_prompt_nodes")
        .select(`
          *,
          user_prompts (
            content,
            llm_model,
            temperature,
            max_tokens,
            top_p,
            frequency_penalty,
            presence_penalty,
            description
          )
        `)
        .eq("id", node.id)

      if (promptNodeError) {
        console.error(promptNodeError);
      }

      const nodeData: ExportGraphPrompt = {
        name: promptNode?.[0]?.user_prompts?.description || "",
        model_settings: {
          model: promptNode?.[0]?.user_prompts?.llm_model || "gpt-4",
          temperature: promptNode?.[0]?.user_prompts?.temperature || 0.7,
          max_tokens: promptNode?.[0]?.user_prompts?.max_tokens || 1000,
          top_p: promptNode?.[0]?.user_prompts?.top_p || 1,
          frequency_penalty: promptNode?.[0]?.user_prompts?.frequency_penalty || 0,
          presence_penalty: promptNode?.[0]?.user_prompts?.presence_penalty || 0,
        },
        prompt: promptNode?.[0]?.user_prompts?.content || "",
      }

      return nodeData;
    }

    return null;
  }

  const getChildren = async (node: any) => {
    const nodeType = node.node_type;
    console.log("Node Type: ", nodeType);
    if (nodeType === "CONDITIONAL") {
      const { data: conditionalNode, error: conditionalNodeError } = await supabase
        .from("graph_conditional_nodes")
        .select("*")
        .eq("graph_node_id", node.id)

      if (conditionalNodeError) {
        console.error(conditionalNodeError);
        return null;
      }

      console.log("Conditional Node: ", conditionalNode);

      const children = [conditionalNode?.[0]?.true_child_id, conditionalNode?.[0]?.false_child_id];
      return children.filter(Boolean); // Filter out null/undefined values
    }
    else {
      return null;
    }
  }

  const buildTreeDFS = async (nodeId: string): Promise<ExportGraphTreeNode | null> => {
    if (!nodeId) return null;

    const nodeData = nodes?.find((node) => node.id === nodeId);
    if (!nodeData) return null;

    const node: ExportGraphTreeNode = {
      name: nodeData.label || "",
      node_type: nodeData.node_type || "",
      node_data: await getNodeData(nodeData),
      children: null,
    };

    console.log("Node: ", node);

    const childrenIds = await getChildren(nodeData);
    if (childrenIds && childrenIds.length > 0) {
      const childrenNodes = await Promise.all(
        childrenIds.map(async (childId) => await buildTreeDFS(childId))
      );
      node.children = childrenNodes.filter(Boolean) as ExportGraphTreeNode[];
    }

    return node;
  };

  if (firstNodeId) {
    finalResult.tree = await buildTreeDFS(firstNodeId) || {
      name: "",
      node_type: "",
      node_data: null,
      children: null,
    };
  }

  return finalResult;
}