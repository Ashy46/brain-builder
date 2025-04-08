"use client";

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tables } from "@/types/supabase";

interface AnalysisNodeProps {
  data: {
    label: string;
    states: Tables<"graph_states">[];
  };
  id: string;
}

export function AnalysisNode({ data, id }: AnalysisNodeProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-4 shadow-md w-64">
      <div className="font-semibold text-center mb-3 border-b pb-2">{data.label}</div>
      
      <div className="text-sm">
        {data.states.length === 0 ? (
          <div className="text-neutral-500 dark:text-neutral-400 italic text-center">
            No states defined
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.states.map((state) => (
              <div key={state.id} className="flex justify-between items-center p-2 bg-neutral-50 dark:bg-gray-700 rounded">
                <div>
                  <div className="font-medium">{state.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {state.type}
                  </div>
                </div>
                <div className="text-xs bg-blue-100 dark:bg-blue-900 rounded px-2 py-1">
                  {state.starting_value || 'null'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Output handle for connecting to other nodes */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
} 