"use client";

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionalNodeProps {
  data: {
    label: string;
    nodeType: string;
    stateId?: string;
    operator?: string;
    value?: string;
    stateName?: string;
  };
  id: string;
}

export function ConditionalNode({ data, id }: ConditionalNodeProps) {
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-white dark:bg-gray-800 p-3 shadow-md min-w-52">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch size={16} className="text-amber-500" />
        <div className="font-semibold">{data.label}</div>
      </div>

      {data.stateName && (
        <div className="mt-2 text-xs p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
          <div className="text-neutral-500 dark:text-neutral-400">Condition:</div>
          <div className="font-medium mt-1">
            {data.stateName} {data.operator?.replace(/_/g, ' ').toLowerCase()} {data.value}
          </div>
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 bg-gray-500"
      />

      {/* Output handles for true/false paths */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!left-1/4 w-3 h-3 !bg-green-500"
      />
      <div className="absolute bottom-0 left-1/4 transform -translate-x-1/2 -translate-y-4 text-xs text-green-600 dark:text-green-400">
        True
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!left-3/4 w-3 h-3 !bg-red-500"
      />
      <div className="absolute bottom-0 left-3/4 transform -translate-x-1/2 -translate-y-4 text-xs text-red-600 dark:text-red-400">
        False
      </div>
    </div>
  );
} 