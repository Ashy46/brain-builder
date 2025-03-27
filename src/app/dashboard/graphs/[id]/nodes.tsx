import { Handle, Position, NodeProps } from "@xyflow/react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";
import { SelectStatesDialog } from "./select-states-dialog";

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
}

export interface PromptNodeData extends BaseNodeData {
  type: "prompt";
  prompt?: string;
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
    // Update width based on content
    if (labelRef.current) {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre';
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

        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-400">
          <button
            onClick={() => setIsSelectingStates(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-white/5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            States: {selectedStatesCount} selected
          </button>
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

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    data.onLabelChange?.(id, newLabel);
    // Update width based on content
    if (labelRef.current) {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre';
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
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre';
      tempSpan.style.font = window.getComputedStyle(labelRef.current).font;
      tempSpan.textContent = newLabel;
      document.body.appendChild(tempSpan);
      const newWidth = Math.max(200, tempSpan.offsetWidth + 40); // Add padding
      document.body.removeChild(tempSpan);
      setWidth(newWidth);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
        <Textarea
          value={data.prompt ?? ""}
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt here..."
          className="w-full text-sm bg-transparent"
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
