import { useCallback } from "react";

import { Position } from "@xyflow/react";

import { Handle } from "@xyflow/react";

export function PromptNode() {
  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <>
      <Handle type="target" position={Position.Top} />

      <div className="rounded-2xl bg-muted/40 border backdrop-blur-md p-4 space-y-3 min-w-[340px]">
        <span className="text-sm text-foreground/50 text-center font-medium block mb-1">
          Prompt
        </span>
      </div>
    </>
  );
}
