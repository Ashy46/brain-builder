import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function Node({
  title,
  children,
  deleteNode,
}: {
  title: string;
  children: React.ReactNode;
  deleteNode: () => void;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 border backdrop-blur-md p-4 space-y-3 min-w-[340px]">
      <div className="flex flex-row justify-between items-center">
        <div className="flex-1" />
        <span className="text-md text-center font-medium">
          {title}
        </span>
        <div className="flex-1 flex justify-end">
          {title !== "Analysis States" && (
            <Button variant="outline" onClick={deleteNode}>
              <Trash2 className="h-4 w-4" color="red" />
            </Button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
