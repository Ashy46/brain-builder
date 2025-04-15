"use client";

import { Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function TestBrainDialog() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-background/50 hover:bg-accent/50 backdrop-blur-md"
        >
          <Brain className="h-4 w-4 mr-2" />
          Test Brain
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Test Brain</SheetTitle>
          <SheetDescription>
            Test your brain's knowledge and capabilities
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {/* Content will go here */}
        </div>
      </SheetContent>
    </Sheet>
  );
} 