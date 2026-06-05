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

  // Actions
  setRawInput: (input: string) => void;
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

  setRawInput: (input) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("json_formatter_raw_input", input);
    }
    set({ rawInput: input });
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
