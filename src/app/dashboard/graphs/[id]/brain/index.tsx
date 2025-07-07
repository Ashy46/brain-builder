"use client";

import { useState } from "react";
import { Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "./chat";

export function BrainChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!isOpen ? (
        <Button
          variant="outline"
          className="bg-background/50 hover:bg-accent/50 backdrop-blur-md"
          onClick={() => setIsOpen(true)}
        >
          <Brain className="h-4 w-4 mr-2" />
          Test Brain
        </Button>
      ) : (
        <div className="w-[500px] h-[800px] bg-background/95 backdrop-blur-md rounded-lg border shadow-lg flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <h3 className="font-semibold">Test Brain</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Chat />
        </div>
      )}
    </div>
  );
}
