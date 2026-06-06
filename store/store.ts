import { create } from "zustand";

export type ViewMode =
  | "formatted"
  | "xml"
  | "csv"
  | "tree"
  | "yaml"
  | "types"
  | "schema"
  | "query"
  | "diff"
  | "escaped"
  | "decoder";

export type CodeLanguage = "typescript" | "go" | "rust" | "python" | "java";

export interface JSONMetrics {
  sizeBytes: number;
  nodeCount: number;
  keyCount: number;
  arrayCount: number;
  maxDepth: number;
}

export interface HistoryItem {
  id: string;
  token: string;
  created_at: string;
}

interface JSONFormatterState {
  rawInput: string;
  formattedOutput: string;
  minifiedOutput: string;
  xmlOutput: string | null;
  csvOutput: string | null;
  parsedJSON: any | null;
  metrics: JSONMetrics | null;
  error: string | null;
  repaired: boolean;
  repairedMessage: string | null;
  indent: number;
  viewMode: ViewMode;
  isLoading: boolean;
  cursorLine: number;
  cursorCol: number;

  // New Utility States
  diffInput: string;
  schemaInput: string;
  queryInput: string;
  decoderInput: string;
  targetLanguage: CodeLanguage;
  systemWarning: string | null;
  activeShareId: string | null;
  isHistoryModalOpen: boolean;
  editorFontSize: number;

  // Actions
  setRawInput: (input: string) => void;
  setEditorFontSize: (size: number) => void;
  setIndent: (indent: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setCursorPos: (line: number, col: number) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  setLoading: (isLoading: boolean) => void;
  setDiffInput: (diffInput: string) => void;
  setSchemaInput: (schemaInput: string) => void;
  setQueryInput: (queryInput: string) => void;
  setDecoderInput: (decoderInput: string) => void;
  setTargetLanguage: (targetLanguage: CodeLanguage) => void;
  setSystemWarning: (warning: string | null) => void;
  setActiveShareId: (id: string | null) => void;
  setHistoryModalOpen: (isOpen: boolean) => void;
  addToHistory: (id: string, token: string) => void;
  removeFromHistory: (id: string) => void;
  setAnalysisResults: (results: {
    formatted: string;
    minified: string;
    xml: string | null;
    csv: string | null;
    metrics: JSONMetrics;
    parsed: any;
    repaired: boolean;
    repairError?: string;
  }) => void;
}

export const useJSONStore = create<JSONFormatterState>((set) => ({
  rawInput: "",
  formattedOutput: "",
  minifiedOutput: "",
  xmlOutput: null,
  csvOutput: null,
  parsedJSON: null,
  metrics: null,
  error: null,
  repaired: false,
  repairedMessage: null,
  indent: 2,
  viewMode: "formatted",
  isLoading: false,
  cursorLine: 1,
  cursorCol: 1,

  // New Utility Initial States
  diffInput: "",
  schemaInput: "",
  queryInput: "",
  decoderInput: "",
  targetLanguage: "typescript",
  systemWarning: null,
  activeShareId: null,
  isHistoryModalOpen: false,
  editorFontSize: 14,

  setRawInput: (input) => {
    let warningMsg: string | null = null;
    if (typeof window !== "undefined") {
      const MAX_STORAGE_SIZE = 1500000; // 1.5MB limit
      if (input.length > MAX_STORAGE_SIZE) {
        localStorage.removeItem("json_formatter_raw_input");
        warningMsg = "Memory Mode: Payload > 1.5MB. Bypassing local storage.";
        console.warn(`[Storage] Input size (${input.length} chars) exceeds local storage threshold of 1.5MB. Bypassing localStorage.`);
      } else {
        try {
          localStorage.setItem("json_formatter_raw_input", input);
        } catch (e) {
          warningMsg = "Storage Quota Exceeded: Operating in memory-only mode.";
          console.warn("[Storage] Failed to save rawInput to localStorage. Removing key to clear space.", e);
          localStorage.removeItem("json_formatter_raw_input");
        }
      }
    }
    set({ rawInput: input, systemWarning: warningMsg });
  },
  setIndent: (indent) => set({ indent }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCursorPos: (line, col) => set({ cursorLine: line, cursorCol: col }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  // New Actions
  setDiffInput: (diffInput) => set({ diffInput }),
  setSchemaInput: (schemaInput) => set({ schemaInput }),
  setQueryInput: (queryInput) => set({ queryInput }),
  setDecoderInput: (decoderInput) => set({ decoderInput }),
  setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
  setSystemWarning: (warning) => set({ systemWarning: warning }),
  setActiveShareId: (id) => set({ activeShareId: id }),
  setHistoryModalOpen: (isOpen) => set({ isHistoryModalOpen: isOpen }),
  setEditorFontSize: (size) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("json_formatter_font_size", String(size));
    }
    set({ editorFontSize: size });
  },

  addToHistory: (id, token) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("json_formatter_history");
      const history: HistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
      // Keep only last 50
      const newHistory = [{ id, token, created_at: new Date().toISOString() }, ...history.filter(h => h.id !== id)].slice(0, 50);
      localStorage.setItem("json_formatter_history", JSON.stringify(newHistory));
    }
  },

  removeFromHistory: (id) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("json_formatter_history");
      if (historyStr) {
        const history: HistoryItem[] = JSON.parse(historyStr);
        const newHistory = history.filter((h) => h.id !== id);
        localStorage.setItem("json_formatter_history", JSON.stringify(newHistory));
      }
    }
  },

  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("json_formatter_raw_input");
    }
    set({
      rawInput: "",
      formattedOutput: "",
      minifiedOutput: "",
      xmlOutput: null,
      csvOutput: null,
      parsedJSON: null,
      metrics: null,
      error: null,
      repaired: false,
      repairedMessage: null,
      isLoading: false,
      cursorLine: 1,
      cursorCol: 1,
      diffInput: "",
      schemaInput: "",
      queryInput: "",
      decoderInput: "",
      systemWarning: null,
      activeShareId: null,
    });
  },

  setAnalysisResults: (results) =>
    set({
      formattedOutput: results.formatted,
      minifiedOutput: results.minified,
      xmlOutput: results.xml,
      csvOutput: results.csv,
      metrics: results.metrics,
      parsedJSON: results.parsed,
      repaired: results.repaired,
      repairedMessage: results.repairError || null,
      error: null,
      isLoading: false,
    }),
}));
