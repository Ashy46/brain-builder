"use client";

import { useState } from "react";

import { PencilIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { DeveloperSettings } from "./developer-settings";
import { OpenAISettings } from "./openai-settings";

export function SettingsItem({
  title,
  description,
  icon,
  dialogContent,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  dialogContent: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="cursor-pointer animate-in fade-in zoom-in-95"
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <OpenAISettings />
        <DeveloperSettings />
      </div>
    </>
  );
}
