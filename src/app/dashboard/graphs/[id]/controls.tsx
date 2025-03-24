import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlsProps {
  onInteractivityChange?: (isInteractive: boolean) => void;
  isInteractive?: boolean;
}

export function Controls({
  onInteractivityChange,
  isInteractive = true,
}: ControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isLocked, setIsLocked] = useState(!isInteractive);

  const handleLockToggle = () => {
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    onInteractivityChange?.(!newLockedState);
  };

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomIn()}
        className="size-10 bg-background/50 hover:bg-accent/50"
        disabled={isLocked}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomOut()}
        className="size-10 bg-background/50 hover:bg-accent/50"
        disabled={isLocked}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => fitView({ duration: 500 })}
        className="size-10 bg-background/50 hover:bg-accent/50"
        disabled={isLocked}
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleLockToggle}
        className={cn(
          "size-10 bg-background/50 hover:bg-accent/50",
          isLocked &&
            "border-destructive text-destructive hover:bg-destructive/10"
        )}
      >
        {isLocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
