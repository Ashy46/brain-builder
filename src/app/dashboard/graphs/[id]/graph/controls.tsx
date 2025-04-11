import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Controls() {
  const { theme, setTheme } = useTheme();

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    mounted && (
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="size-10 bg-background/50 hover:bg-accent/50 backdrop-blur-md"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => zoomIn()}
          className="size-10 bg-background/50 hover:bg-accent/50 backdrop-blur-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => zoomOut()}
          className="size-10 bg-background/50 hover:bg-accent/50 backdrop-blur-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => fitView({ duration: 500 })}
          className="size-10 bg-background/50 hover:bg-accent/50 backdrop-blur-md"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    )
  );
}
