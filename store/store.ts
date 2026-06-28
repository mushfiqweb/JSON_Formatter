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

export interface ToastMessage {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  technicalNote?: string;
  duration?: number;
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

  toasts: ToastMessage[];
  lastSizeClass: number;

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
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
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

let storageDebounceTimeout: NodeJS.Timeout | null = null;

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
  toasts: [],
  lastSizeClass: 0,

  setRawInput: (input) => {
    let warningMsg: string | null = null;
    const len = input.length;

    // Determine current size class
    let newClass = 0;
    if (len > 50000000) newClass = 4; // > 50MB
    else if (len > 10000000) newClass = 3; // > 10MB
    else if (len > 5000000) newClass = 2; // > 5MB
    else if (len > 1500000) newClass = 1; // > 1.5MB

    if (typeof window !== "undefined") {
      const MAX_STORAGE_SIZE = 1500000; // 1.5MB limit
      if (storageDebounceTimeout) {
        clearTimeout(storageDebounceTimeout);
        storageDebounceTimeout = null;
      }
      if (len > MAX_STORAGE_SIZE) {
        localStorage.removeItem("json_formatter_raw_input");
        warningMsg = "Memory Mode: Payload > 1.5MB. Bypassing local storage.";
      } else {
        // Debounce writing to localStorage to prevent blocking the main thread during typing
        storageDebounceTimeout = setTimeout(() => {
          try {
            localStorage.setItem("json_formatter_raw_input", input);
          } catch (e) {
            console.warn("[Storage] Failed to save rawInput to localStorage. Removing key to clear space.", e);
            localStorage.removeItem("json_formatter_raw_input");
            set({ systemWarning: "Storage Quota Exceeded: Operating in memory-only mode." });
          }
        }, 800); // 800ms debounce
      }
    }

    // Trigger toast only if category changes
    const currentState = useJSONStore.getState();
    const lastSizeClass = currentState.lastSizeClass;

    if (newClass !== lastSizeClass) {
      if (newClass === 1) {
        currentState.showToast({
          type: "info",
          title: "Memory Mode Activated",
          description: `Payload size is ${(len / 1024 / 1024).toFixed(1)}MB. Bypassing browser localStorage cache to keep interface fluid.`,
          technicalNote: "Data won't persist on page refresh. 5MB origin limit check bypassed to prevent main thread blocking.",
          duration: 7000,
        });
      } else if (newClass === 2) {
        currentState.showToast({
          type: "warning",
          title: "High Load Detected",
          description: `Large payload of ${(len / 1024 / 1024).toFixed(1)}MB. Monaco editor features may experience brief delays.`,
          technicalNote: "Monaco worker thread is under heavy processing stress. Web Worker latency is slightly elevated.",
          duration: 8000,
        });
      } else if (newClass === 3) {
        currentState.showToast({
          type: "warning",
          title: "Heavy Memory Load Warning",
          description: `Payload size of ${(len / 1024 / 1024).toFixed(1)}MB is straining the V8 JavaScript engine heap limits.`,
          technicalNote: "Stuttering may occur due to intensive Garbage Collection. Consider using the Minified or Schema view.",
          duration: 9000,
        });
      } else if (newClass === 4) {
        currentState.showToast({
          type: "error",
          title: "Extreme Payload Risk",
          description: `Extreme payload size of ${(len / 1024 / 1024).toFixed(1)}MB. High risk of browser tab crash.`,
          technicalNote: "Memory allocation exceeds baseline limits. High latency expected. Recommend splitting data into chunks.",
          duration: 11000,
        });
      }
    }

    set({ rawInput: input, systemWarning: warningMsg, lastSizeClass: newClass });
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

  showToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto-dismiss after duration (default 6000ms)
    const duration = toast.duration || 6000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
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
