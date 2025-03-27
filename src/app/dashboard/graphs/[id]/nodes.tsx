import { Handle, Position, NodeProps } from "@xyflow/react";
import { useRef, useState, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";
import { createClient } from "@/lib/supabase/client";

import { Textarea } from "@/components/ui/textarea";
import { SelectStatesDialog } from "./select-states-dialog";
import { BuildConditionalDialog } from "./build-conditional-dialog";
import { Button } from "@/components/ui/button";

export type NodeType = "analysis" | "conditional" | "prompt";

export interface BaseNodeData {
  label: string;
  type: NodeType;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

export interface AnalysisNodeData extends BaseNodeData {
  type: "analysis";
  childId?: string;
  selectedStates: string[];
  onStatesChange?: (nodeId: string, stateIds: string[]) => void;
  graphId: string;
}

export interface ConditionalNodeData extends BaseNodeData {
  type: "conditional";
  trueChildId?: string;
  falseChildId?: string;
  conditions?: {
    stateId: string;
    operator:
      | "equals"
      | "notEquals"
      | "greaterThan"
      | "lessThan"
      | "contains"
      | "notContains";
    value: string;
  }[];
  operator?: "and" | "or";
  onConditionalChange?: (nodeId: string, data: ConditionalNodeData) => void;
  graphId: string;
}

export interface PromptNodeData extends BaseNodeData {
  type: "prompt";
  prompt?: string;
  graphId: string;
  onPromptChange?: (nodeId: string, newData: PromptNodeData) => void;
}

export type CustomNodeData =
  | AnalysisNodeData
  | ConditionalNodeData
  | PromptNodeData;

export interface CustomNode {
  id: string;
  position: { x: number; y: number };
  data: CustomNodeData;
  type: NodeType;
}

function NodeTypeLabel({ type }: { type: NodeType }) {
  return (
    <div className="absolute -top-5 left-0 right-0 text-[10px] text-gray-400 text-center uppercase tracking-wider">
      {type}
    </div>
  );
}

const baseNodeStyles =
  "p-3 shadow-sm rounded-lg border backdrop-blur-[4px] bg-white/5";

export function AnalysisNode({
  data,
  isConnectable,
  selected,
  id,
}: NodeProps & { data: CustomNodeData; selected?: boolean }) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);
  const [isSelectingStates, setIsSelectingStates] = useState(false);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    if (labelRef.current) {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 40); // Add padding
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const analysisData = data as AnalysisNodeData;
  const selectedStatesCount = analysisData.selectedStates?.length || 0;

  const handleStatesChange = (stateIds: string[]) => {
    analysisData.onStatesChange?.(id, stateIds);
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-blue-500/20",
          selected && "border-2 border-blue-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <input
          ref={labelRef}
          type="text"
          value={data.label}
          onChange={handleLabelChange}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0"
          aria-label="Node label"
        />

        <div className="flex items-center justify-center gap-2 mt-2 text-s">
          <Button
            onClick={() => setIsSelectingStates(true)}
            variant="outline"
            size="sm"
          >
            <ArrowLeftRight className="h-4 w-4" />
            States: {selectedStatesCount} selected
          </Button>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>

      <SelectStatesDialog
        open={isSelectingStates}
        onOpenChange={setIsSelectingStates}
        graphId={analysisData.graphId}
        selectedStateIds={analysisData.selectedStates || []}
        onStatesChange={handleStatesChange}
      />
    </div>
  );
}

export function ConditionalNode({
  data,
  isConnectable,
  selected,
  id,
}: NodeProps & { data: CustomNodeData; selected?: boolean }) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);
  const [isBuildingConditional, setIsBuildingConditional] = useState(false);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    if (labelRef.current) {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 40);
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const conditionalData = data as ConditionalNodeData;
  const conditionsCount = conditionalData.conditions?.length || 0;

  const handleConditionalChange = (newData: ConditionalNodeData) => {
    conditionalData.onConditionalChange?.(id, newData);
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-yellow-500/20",
          selected && "border-2 border-yellow-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-yellow-400 !w-3 !h-3 !border-2 !border-background"
        />

        <input
          ref={labelRef}
          type="text"
          value={data.label}
          onChange={handleLabelChange}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0"
          aria-label="Node label"
        />

        <div className="flex items-center justify-center gap-2 mt-2 text-sm">
          <Button
            onClick={() => setIsBuildingConditional(true)}
            variant="outline"
            size="sm"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Conditions: {conditionsCount} set
          </Button>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          isConnectable={isConnectable}
          style={{ left: "30%" }}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          isConnectable={isConnectable}
          style={{ left: "70%" }}
          className="!bg-red-400 !w-3 !h-3 !border-2 !border-background"
        />
      </div>

      <BuildConditionalDialog
        open={isBuildingConditional}
        onOpenChange={setIsBuildingConditional}
        graphId={conditionalData.graphId}
        data={{
          type: "conditional",
          label: conditionalData.label,
          conditions: conditionalData.conditions || [],
          operator: conditionalData.operator || "and",
          graphId: conditionalData.graphId,
          onConditionalChange: conditionalData.onConditionalChange,
        }}
        onConditionalChange={handleConditionalChange}
      />
    </div>
  );
}

function EnhancedPromptTextarea({
  value,
  onChange,
  onKeyDown,
  graphId,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  graphId: string;
}) {
  const [customInfos, setCustomInfos] = useState<Array<{ id: string; name: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCustomInfos() {
      const { data, error } = await supabase
        .from("custom_info")
        .select("id, name")
        .eq("graph_id", graphId);

      if (error) {
        console.error("Error fetching custom infos:", error);
        return;
      }

      setCustomInfos(data || []);
    }

    fetchCustomInfos();
  }, [graphId]);

  // Function to render custom info references as badges
  const renderWithBadges = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        const name = part.slice(2, -2).trim();
        const customInfo = customInfos.find(info => info.name === name);
        
        const badgeClass = customInfo 
          ? "bg-blue-500/20 text-blue-200 border border-blue-500/30" 
          : "bg-red-500/20 text-red-200 border border-red-500/30";
        
        return (
          <span
            key={index}
            className={cn(
              "px-1 rounded text-sm font-medium",
              badgeClass
            )}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative">
      <style jsx>{`
        textarea::selection {
          background: rgba(255, 255, 255, 0.2);
          color: transparent;
        }
      `}</style>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder="Enter your prompt here... Use {{name}} to reference custom info"
        className={cn(
          "w-full text-sm bg-transparent min-h-[100px] font-mono",
          "placeholder:text-muted-foreground",
          value && "text-transparent caret-white selection:text-transparent"
        )}
      />
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none p-[9px] text-sm font-mono whitespace-pre-wrap break-words text-white"
      >
        {renderWithBadges(value)}
      </div>
    </div>
  );
}

export function PromptNode({
  data,
  isConnectable,
  selected,
  id,
}: NodeProps & { data: PromptNodeData; selected?: boolean }) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(200);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newData = {
      ...data,
      prompt: e.target.value,
    };
    data.onPromptChange?.(id, newData);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    // Update width based on content
    if (labelRef.current) {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 40); // Add padding
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <NodeTypeLabel type={data.type} />
      <div
        className={cn(
          baseNodeStyles,
          "border-green-500/20",
          selected && "border-2 border-green-400/50"
        )}
        style={{ width: `${width}px` }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-green-400 !w-3 !h-3 !border-2 !border-background"
        />

        <input
          ref={labelRef}
          type="text"
          value={data.label}
          onChange={handleLabelChange}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0 mb-2"
          aria-label="Node label"
        />
        <EnhancedPromptTextarea
          value={data.prompt ?? ""}
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          graphId={data.graphId}
        />
      </div>
    </div>
  );
}

export const nodeTypes = {
  analysis: AnalysisNode,
  conditional: ConditionalNode,
  prompt: PromptNode,
};
