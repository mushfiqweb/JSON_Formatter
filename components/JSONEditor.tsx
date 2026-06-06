"use client";

import React, { useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useJSONStore } from "@/store/store";
import { repairAndFormatJSON } from "@/utils/jsonUtils";

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function JSONEditor({ value, onChange, readOnly = false }: JSONEditorProps) {
  const setCursorPos = useJSONStore((state) => state.setCursorPos);
  const editorFontSize = useJSONStore((state) => state.editorFontSize);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Define a premium custom theme matching our Zen UI palette
    monaco.editor.defineTheme("zen-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "38bdf8" }, // Sky 400
        { token: "string.value.json", foreground: "22d3ee" }, // Cyan 400
        { token: "number", foreground: "a78bfa" }, // Violet 400
        { token: "keyword", foreground: "f472b6" }, // Pink 400
        { token: "delimiter", foreground: "71717a" }, // Zinc 500
      ],
      colors: {
        "editor.background": "#09090b", // Zinc 950
        "editor.foreground": "#f4f4f5", // Zinc 100
        "editor.lineHighlightBackground": "#18181b", // Zinc 900
        "editor.lineHighlightBorder": "#00000000",
        "editorCursor.foreground": "#06b6d4", // Cyan 500
        "editorLineNumber.foreground": "#3f3f46", // Zinc 700
        "editorLineNumber.activeForeground": "#a1a1aa", // Zinc 400
        "scrollbarSlider.background": "#27272a80", // Zinc 800 (translucent)
        "scrollbarSlider.hoverBackground": "#3f3f46b3", // Zinc 700
        "scrollbarSlider.activeBackground": "#52525b", // Zinc 600
      },
    });

    monaco.editor.setTheme("zen-dark");

    // Track cursor movements to update the status bar
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos(e.position.lineNumber, e.position.column);
    });

    // Auto-format raw input on paste
    if (!readOnly) {
      editor.onDidPaste((e: any) => {
        setTimeout(() => {
          const rawText = editor.getValue();
          if (!rawText.trim()) return;

          const currentIndent = useJSONStore.getState().indent;
          const result = repairAndFormatJSON(rawText, currentIndent);

          if (result.formatted && result.formatted !== rawText) {
            const model = editor.getModel();
            if (model) {
              editor.executeEdits("paste-autoformat", [
                {
                  range: model.getFullModelRange(),
                  text: result.formatted,
                  forceMoveMarkers: true,
                },
              ]);

              // Reset scroll position and cursor location to top-left
              editor.setScrollLeft(0);
              editor.setScrollTop(0);
              editor.setPosition({ lineNumber: 1, column: 1 });

              // Use a microtask fallback to override any delayed auto-scrolling by Monaco
              setTimeout(() => {
                editor.setScrollLeft(0);
                editor.setScrollTop(0);
              }, 0);
            }
          }
        }, 50);
      });
    }
  };

  return (
    <div className="w-full h-full relative border border-zinc-800/80 rounded-lg overflow-hidden bg-zinc-950 focus-within:border-cyan-500/50 transition-colors duration-200">
      <Editor
        height="100%"
        width="100%"
        language="json"
        value={value}
        theme="vs-dark"
        loading={
          <div className="flex flex-col items-center justify-center h-full space-y-4 bg-zinc-950 text-zinc-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="text-sm font-mono tracking-widest text-zinc-500">INITIALIZING EDITOR...</span>
          </div>
        }
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: editorFontSize,
          fontFamily: "var(--font-geist-mono), monospace",
          lineHeight: Math.round(editorFontSize * 1.57),
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          folding: true,
          automaticLayout: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          padding: { top: 12, bottom: 12 },
          contextmenu: !readOnly,
        }}
      />
    </div>
  );
}
