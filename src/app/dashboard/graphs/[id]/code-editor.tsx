import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
}) {
  const { theme } = useTheme();
  
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div
      className={cn(
        "h-full w-full border border-border rounded-md overflow-hidden",
        className
      )}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={value}
        onChange={handleEditorChange}
        theme={theme === "dark" ? "vs-dark" : "light"}
        options={{
          readOnly,
          fontSize: 14,
          lineNumbers: "on",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          roundedSelection: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
          },
          tabSize: 2,
          wordWrap: "on",
          folding: true,
          renderWhitespace: "selection",
          renderLineHighlight: "all",
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          wordBasedSuggestions: "currentDocument",
          parameterHints: {
            enabled: true,
          },
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
