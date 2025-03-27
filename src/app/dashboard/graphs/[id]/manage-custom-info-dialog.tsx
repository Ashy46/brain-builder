"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/tailwind";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface CustomInfo {
  id: string;
  name: string;
  data: string | null;
  type: "number" | "text" | "json" | "boolean";
}

function EditCustomInfoDialog({
  customInfo,
  onClose,
  onUpdate,
  onDelete,
}: {
  customInfo: CustomInfo;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CustomInfo>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(customInfo.name);
  const [data, setData] = useState(customInfo.data || "");
  const [type, setType] = useState(customInfo.type);

  // Update parent component when values change
  const handleUpdate = (updates: Partial<CustomInfo>) => {
    onUpdate(customInfo.id, updates);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Custom Info</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              className="h-10 mt-2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleUpdate({ name: e.target.value });
              }}
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value: "number" | "text" | "json" | "boolean") => {
                setType(value);
                handleUpdate({ type: value });
              }}
            >
              <SelectTrigger className="h-10 mt-2">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data</Label>
            {type === "boolean" ? (
              <Select
                value={data}
                onValueChange={(value) => {
                  setData(value);
                  handleUpdate({ data: value });
                }}
              >
                <SelectTrigger className="h-10 mt-2">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : type === "number" ? (
              <Input
                className="h-10 mt-2"
                type="number"
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  handleUpdate({ data: e.target.value });
                }}
              />
            ) : (
              <Textarea
                className="mt-2 min-h-[200px] max-h-[200px] resize-y overflow-auto"
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  handleUpdate({ data: e.target.value });
                }}
                placeholder={`Enter ${type} data...`}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(customInfo.id);
                onClose();
              }}
            >
              Delete Custom Info
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManageCustomInfoDialog({
  open,
  onOpenChange,
  graphId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
}) {
  const { user } = useAuth();
  const supabase = createClient();

  const [customInfos, setCustomInfos] = useState<CustomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCustomInfoName, setNewCustomInfoName] = useState("");
  const [newCustomInfoType, setNewCustomInfoType] = useState<"number" | "text" | "json" | "boolean">("text");
  const [editingCustomInfo, setEditingCustomInfo] = useState<CustomInfo | null>(null);

  useEffect(() => {
    if (open) {
      fetchCustomInfos();
    }
  }, [open, graphId]);

  const fetchCustomInfos = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_info")
        .select("*")
        .eq("graph_id", graphId);

      if (error) throw error;
      setCustomInfos(data || []);
    } catch (error) {
      console.error("Error fetching custom info:", error);
      toast.error("Failed to load custom info");
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomInfo = async () => {
    if (!newCustomInfoName.trim()) {
      toast.error("Custom info name is required");
      return;
    }

    // Check for duplicate names
    const isDuplicate = customInfos.some(
      (info) => info.name.toLowerCase() === newCustomInfoName.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("A custom info with this name already exists");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("custom_info")
        .insert({
          name: newCustomInfoName.trim(),
          graph_id: graphId,
          data: null,
          type: newCustomInfoType,
        })
        .select()
        .single();

      if (error) throw error;

      const newCustomInfo = data;
      setCustomInfos((prev) => [...prev, newCustomInfo]);
      setNewCustomInfoName("");
      setNewCustomInfoType("text");
      toast.success("Custom info created successfully");
    } catch (error) {
      console.error("Error creating custom info:", error);
      toast.error("Failed to create custom info");
    }
  };

  const updateCustomInfo = async (customInfoId: string, updates: Partial<CustomInfo>) => {
    // Check for duplicate names when updating
    if (updates.name) {
      const isDuplicate = customInfos.some(
        (info) =>
          info.id !== customInfoId &&
          info.name.toLowerCase() === updates.name!.toLowerCase()
      );

      if (isDuplicate) {
        toast.error("A custom info with this name already exists");
        return;
      }
    }

    setCustomInfos(
      customInfos.map((customInfo) =>
        customInfo.id === customInfoId ? { ...customInfo, ...updates } : customInfo
      )
    );

    try {
      const { error } = await supabase
        .from("custom_info")
        .update(updates)
        .eq("id", customInfoId);

      if (error) throw error;
      toast.success("Custom info updated successfully");
    } catch (error) {
      console.error("Error updating custom info:", error);
      toast.error("Failed to update custom info");
      await fetchCustomInfos();
    }
  };

  const deleteCustomInfo = async (customInfoId: string) => {
    setCustomInfos(customInfos.filter((customInfo) => customInfo.id !== customInfoId));

    try {
      const { error } = await supabase
        .from("custom_info")
        .delete()
        .eq("id", customInfoId);

      if (error) throw error;
      toast.success("Custom info deleted successfully");
    } catch (error) {
      console.error("Error deleting custom info:", error);
      toast.error("Failed to delete custom info");
      await fetchCustomInfos();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Custom Info</DialogTitle>
            <div className="flex gap-2">
              <Input
                placeholder="New custom info name"
                value={newCustomInfoName}
                onChange={(e) => setNewCustomInfoName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createCustomInfo();
                  }
                }}
                className="h-10"
              />
              <Select
                value={newCustomInfoType}
                onValueChange={(value: "number" | "text" | "json" | "boolean") =>
                  setNewCustomInfoType(value)
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createCustomInfo} className="h-10">
                <Plus className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                customInfos.map((customInfo) => (
                  <div
                    key={customInfo.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{customInfo.name}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          customInfo.type === "number"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : customInfo.type === "json"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : customInfo.type === "boolean"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        )}
                      >
                        {customInfo.type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCustomInfo(customInfo)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {editingCustomInfo && (
        <EditCustomInfoDialog
          customInfo={editingCustomInfo}
          onClose={() => setEditingCustomInfo(null)}
          onUpdate={updateCustomInfo}
          onDelete={deleteCustomInfo}
        />
      )}
    </>
  );
} 