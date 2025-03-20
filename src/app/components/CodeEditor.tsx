import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  width?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  height = "100%",
  width = "100%",
}: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div
      style={{
        height,
        width,
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        overflow: "hidden",
      }}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={value}
        onChange={handleEditorChange}
        options={{
          readOnly,
          fontSize: 14,
          lineNumbers: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          roundedSelection: false,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
          },
          tabSize: 2,
          wordWrap: "on",
          folding: true,
          renderWhitespace: "selection",
          renderLineHighlight: "all",
          bracketPairColorization: {
            enabled: true,
          },
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
