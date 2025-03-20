import { Button } from "@/components/ui/button";
import { CodeEditor } from "./CodeEditor";

interface JsonEditorProps {
  jsonInput: string;
  onJsonChange: (json: string) => void;
  onSubmit: () => void;
}

export function JsonEditor({
  jsonInput,
  onJsonChange,
  onSubmit,
}: JsonEditorProps) {
  const handleFormatJson = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      onJsonChange(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="json-input" className="font-medium">
          Node Structure (JSON)
        </label>
        <Button variant="outline" size="sm" onClick={handleFormatJson}>
          Format JSON
        </Button>
      </div>

      <div className="flex-1">
        <CodeEditor
          value={jsonInput}
          onChange={onJsonChange}
          language="json"
          height="100%"
        />
      </div>
      <Button className="mt-2" onClick={onSubmit}>
        Update Graph
      </Button>
    </div>
  );
}
