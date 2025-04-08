"use client";

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

interface PromptNodeProps {
  data: {
    label: string;
    nodeType: string;
    promptId?: string;
    promptDescription?: string;
  };
  id: string;
}

export function PromptNode({ data, id }: PromptNodeProps) {
  return (
    <div className="rounded-lg border-2 border-violet-400 bg-white dark:bg-gray-800 p-3 shadow-md min-w-52">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} className="text-violet-500" />
        <div className="font-semibold">{data.label}</div>
      </div>
      
      {data.promptDescription && (
        <div className="mt-2 text-xs p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
          <div className="text-neutral-500 dark:text-neutral-400">Using prompt:</div>
          <div className="font-medium mt-1 line-clamp-3">{data.promptDescription}</div>
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 bg-gray-500"
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-violet-500"
      />
    </div>
  );
} 