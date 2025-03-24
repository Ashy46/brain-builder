import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomControlsProps {
  onInteractivityChange?: (isInteractive: boolean) => void;
  isInteractive?: boolean;
}

export function CustomControls({ onInteractivityChange, isInteractive = true }: CustomControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isLocked, setIsLocked] = useState(!isInteractive);

  const handleLockToggle = () => {
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    onInteractivityChange?.(!newLockedState);
  };

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2 p-2 rounded-lg bg-background/80 backdrop-blur border shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomIn()}
        className="h-8 w-8 hover:bg-background/80"
        disabled={isLocked}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomOut()}
        className="h-8 w-8 hover:bg-background/80"
        disabled={isLocked}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fitView({ duration: 500 })}
        className="h-8 w-8 hover:bg-background/80"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLockToggle}
        className={cn(
          "h-8 w-8 hover:bg-background/80",
          isLocked && "text-destructive"
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