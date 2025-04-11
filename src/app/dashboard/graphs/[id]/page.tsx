"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Graph } from "./graph";
import AddNodeDialog from "./dialogs/add-node-dialog";

export default function GraphPage() {
  const router = useRouter();

  return (
    <>
      <div className="top-4 left-4 absolute flex flex-row gap-3 z-50">
        <Button
          variant="outline"
          className="bg-background/50 hover:bg-accent/50 backdrop-blur-md"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <AddNodeDialog />
      </div>

      <Graph />
    </>
  );
}
