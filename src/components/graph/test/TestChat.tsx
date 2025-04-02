import { Card } from "@/components/ui/card";

interface TestChatProps {
  isOpen: boolean;
}

export function TestChat({ isOpen }: TestChatProps) {
  if (!isOpen) return null;

  return (
    <Card className="fixed right-4 top-4 h-[calc(100vh-2rem)] w-96 p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Test Chat</h2>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Chat messages will go here */}
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
    </Card>
  );
} 