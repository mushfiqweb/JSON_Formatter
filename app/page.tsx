"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ToastContainer from "@/components/ToastContainer";
import { useJSONStore, ViewMode, CodeLanguage } from "@/store/store";
import JSONTreeView from "@/components/JSONTreeView";
import {
  encryptJSON,
  computeJSONMetrics,
  repairAndFormatJSON,
  minifyJSON,
  convertJSONToXML,
  convertJSONToCSV,
  escapeJSONString,
  unescapeJSONString,
  decodeJWTOrBase64,
  parseJSONError,
} from "@/utils/jsonUtils";
import {
  jsonToTypeScript,
  jsonToGo,
  jsonToRust,
  jsonToPython,
  jsonToJava
} from "@/utils/typeGenerator";
import { generateJSONSchemaString } from "@/utils/schemaGenerator";
import YAML from "yaml";
import { JSONPath } from "jsonpath-plus";
import Ajv from "ajv";
import { DiffEditor } from "@monaco-editor/react";
import { supabaseClient, isSupabaseMocked } from "@/utils/supabaseClient";
import {
  Sparkles,
  AlignLeft,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Share2,
  Database,
  Info,
  Check,
  Code,
  FileCode,
  Table,
  TreeDeciduous,
  AlertCircle,
  HelpCircle,
  GitCompare,
  Search,
  Braces,
  Quote,
  Key,
  History,
  Eye,
  Clock,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR errors
const JSONEditor = dynamic(() => import("@/components/JSONEditor"), {
  ssr: false,
});

// Subscribe to browser network status changes using React's useSyncExternalStore
const onlineStore = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => { };
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  },
  getSnapshot() {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  },
  getServerSnapshot() {
    return true; // Default to true on the server
  }
};

export default function HomePage() {
  const {
    rawInput,
    formattedOutput,
    minifiedOutput,
    xmlOutput,
    csvOutput,
    parsedJSON,
    metrics,
    error,
    repaired,
    repairedMessage,
    indent,
    viewMode,
    isLoading,
    cursorLine,
    cursorCol,
    diffInput,
    schemaInput,
    queryInput,
    decoderInput,
    targetLanguage,
    systemWarning,
    activeShareId,
    isHistoryModalOpen,
    editorFontSize,
    setRawInput,
    setIndent,
    setViewMode,
    setError,
    clearAll,
    setLoading,
    setDiffInput,
    setSchemaInput,
    setQueryInput,
    setDecoderInput,
    setTargetLanguage,
    setHistoryModalOpen,
    removeFromHistory,
    setEditorFontSize,
    setAnalysisResults,
  } = useJSONStore();

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diffDisposablesRef = useRef<any[]>([]);
  const diffEditorRef = useRef<any>(null);

  const [showLandingMessage, setShowLandingMessage] = useState<boolean>(true);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareError, setShareError] = useState("");
  const [isDeleteShareModalOpen, setIsDeleteShareModalOpen] = useState(false);
  const [isDeletingShare, setIsDeletingShare] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreViewsOpen, setIsMoreViewsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rightPaneRef = useRef<HTMLElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(30); // 30% default width
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");

  // New developer utilities local states and triggers
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaSuccess, setSchemaSuccess] = useState<boolean>(false);
  const [decodedResult, setDecodedResult] = useState<any>(null);
  const [escapedLocal, setEscapedLocal] = useState("");
  const [visitorTime, setVisitorTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isOnline = useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot
  );

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Fetch GitHub Star Count dynamically on mount
  useEffect(() => {
    fetch("https://api.github.com/repos/mushfiqweb/JSON_Formatter")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch github data");
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStarCount(data.stargazers_count);
        }
      })
      .catch((err) => console.error("Error fetching GitHub stars:", err));
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (rightPaneRef.current) {
          await rightPaneRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
    }
  };

  // Monitor desktop width to prevent layout issues
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ticking clock for local visitor date/time
  useEffect(() => {
    setVisitorTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setVisitorTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Sync diff input when empty
  useEffect(() => {
    if (formattedOutput && !diffInput) {
      setDiffInput(formattedOutput);
    }
  }, [formattedOutput, diffInput, setDiffInput]);

  // Sync escaped local string when rawInput changes
  useEffect(() => {
    if (rawInput) {
      setEscapedLocal(escapeJSONString(rawInput));
    } else {
      setEscapedLocal("");
    }
  }, [rawInput]);

  // Sync auto-generated schema when schemaInput is empty
  useEffect(() => {
    if (parsedJSON && !schemaInput) {
      setSchemaInput(generateJSONSchemaString(parsedJSON));
    }
  }, [parsedJSON, schemaInput, setSchemaInput]);

  const handleValidateSchema = () => {
    setSchemaError(null);
    setSchemaSuccess(false);

    if (!parsedJSON) {
      setSchemaError("No valid JSON payload parsed in the workspace.");
      return;
    }

    try {
      const ajv = new Ajv({ allErrors: true });
      const schemaObj = JSON.parse(schemaInput);
      const validate = ajv.compile(schemaObj);
      const valid = validate(parsedJSON);

      if (valid) {
        setSchemaSuccess(true);
      } else {
        const errorsText = validate.errors
          ?.map((err) => `• Path "${err.instancePath || "/"}" ${err.message}`)
          .join("\n");
        setSchemaError(errorsText || "Validation failed against schema.");
      }
    } catch (err: any) {
      setSchemaError(`JSON Schema Error: ${err.message}`);
    }
  };

  const handleResetSchema = () => {
    if (parsedJSON) {
      setSchemaInput(generateJSONSchemaString(parsedJSON));
      setSchemaError(null);
      setSchemaSuccess(false);
    }
  };

  const handleDecodeToken = (token: string) => {
    setDecoderInput(token);
    if (!token.trim()) {
      setDecodedResult(null);
      return;
    }
    const result = decodeJWTOrBase64(token);
    setDecodedResult(result);
  };

  const handleLoadDecodedToWorkspace = () => {
    if (!decodedResult) return;
    const payloadStr = decodedResult.payload
      ? JSON.stringify(decodedResult.payload, null, indent)
      : decodedResult.rawPayload || "";
    if (payloadStr) {
      setRawInput(payloadStr);
      runAnalysis(payloadStr);
      setViewMode("formatted");
    }
  };

  const handleUnescapeAction = (input: string) => {
    const unesc = unescapeJSONString(input);
    setRawInput(unesc);
    runAnalysis(unesc);
    setViewMode("formatted");
  };

  const handleDiffEditorMount = (editor: any) => {
    diffEditorRef.current = editor;
    const modifiedEditor = editor.getModifiedEditor();
    const disposable = modifiedEditor.onDidChangeModelContent(() => {
      setDiffInput(modifiedEditor.getValue());
    });
    diffDisposablesRef.current.push(disposable);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain left pane width between 15% and 85%
      if (newWidth >= 15 && newWidth <= 85) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Clean up diff editor disposables when switching away from diff view mode to prevent memory leaks
  useEffect(() => {
    if (viewMode !== "diff") {
      diffDisposablesRef.current.forEach((d) => {
        if (d && typeof d.dispose === "function") {
          d.dispose();
        }
      });
      diffDisposablesRef.current = [];
      diffEditorRef.current = null;
    }
  }, [viewMode]);

  // Update diff editor options dynamically when editorFontSize changes
  useEffect(() => {
    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({
        fontSize: editorFontSize,
        lineHeight: Math.round(editorFontSize * 1.02),
      });
    }
  }, [editorFontSize]);

  // Recalculate diff editor layout when custom fonts finish loading
  useEffect(() => {
    if (typeof window !== "undefined" && (document as any).fonts) {
      const handleFontsLoaded = () => {
        if (diffEditorRef.current) {
          diffEditorRef.current.layout();
        }
      };
      (document as any).fonts.ready.then(handleFontsLoaded);
      (document as any).fonts.addEventListener("loadingdone", handleFontsLoaded);
      return () => {
        (document as any).fonts.removeEventListener("loadingdone", handleFontsLoaded);
      };
    }
  }, []);

  // Clean up debounce timeout, diff editor listeners, and suppress Monaco Canceled errors on unmount
  useEffect(() => {
    // 1. Intercept unhandled promise rejections (harmless Monaco cancellations)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason) {
        const reasonStr = String(event.reason.message || event.reason.name || event.reason || "");
        if (reasonStr.includes("Canceled") || reasonStr.includes("Canceled: Canceled")) {
          event.preventDefault();
        }
      }
    };

    // 2. Intercept console.error calls directly (sometimes logged directly by Monaco core)
    const originalConsoleError = console.error;
    const patchedConsoleError = (...args: any[]) => {
      const hasCancellation = args.some(arg => {
        if (!arg) return false;
        const str = String(arg.message || arg.name || arg || "");
        return str.includes("Canceled") || str.includes("ERR Canceled");
      });

      if (hasCancellation) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleRejection);
      console.error = patchedConsoleError;
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      diffDisposablesRef.current.forEach((d) => {
        if (d && typeof d.dispose === "function") {
          d.dispose();
        }
      });
      diffDisposablesRef.current = [];

      if (typeof window !== "undefined") {
        window.removeEventListener("unhandledrejection", handleRejection);
        console.error = originalConsoleError;
      }
    };
  }, []);

  // Main Thread Core Analysis Logic
  const runAnalysis = (value: string) => {
    if (!value || !value.trim()) {
      clearAll();
      return;
    }

    setLoading(true);

    // Defer to prevent blocking editor frame updates
    setTimeout(() => {
      try {
        const byteSize = new Blob([value]).size;
        const currentIndent = useJSONStore.getState().indent;
        let parsed: any;
        let isRepaired = false;
        let repairErr: string | undefined;
        let formatted = "";
        let minified = "";

        try {
          parsed = JSON.parse(value);
          formatted = JSON.stringify(parsed, null, currentIndent);
          minified = JSON.stringify(parsed);
        } catch (err: any) {
          // Attempt automatic repair for bad syntax or LLM artifacts
          try {
            const repairedStr = repairAndFormatJSON(value, currentIndent);
            if (repairedStr.error && !repairedStr.error.startsWith("Failed")) {
              parsed = JSON.parse(repairedStr.formatted);
              formatted = repairedStr.formatted;
              minified = JSON.stringify(parsed);
              isRepaired = true;
              repairErr = repairedStr.error;
            } else {
              throw err;
            }
          } catch (repairErr: any) {
            const parsedErr = parseJSONError(err, value);
            let displayError = "";
            if (parsedErr.line !== undefined && parsedErr.column !== undefined) {
              displayError = `Error at Line ${parsedErr.line}, Col ${parsedErr.column}: ${parsedErr.message}`;
            } else {
              displayError = `Failed to parse or repair: ${parsedErr.message}`;
            }
            setError(displayError);
            setLoading(false);
            return;
          }
        }

        const metricsData = computeJSONMetrics(parsed, byteSize);


        setAnalysisResults({
          formatted,
          minified,
          xml: null, // Reset XML to null, computed lazily
          csv: null, // Reset CSV to null, computed lazily
          metrics: metricsData,
          parsed,
          repaired: isRepaired,
          repairError: repairErr,
        });
      } catch (err: any) {
        const parsedErr = parseJSONError(err, value);
        let displayError = "";
        if (parsedErr.line !== undefined && parsedErr.column !== undefined) {
          displayError = `Error at Line ${parsedErr.line}, Col ${parsedErr.column}: ${parsedErr.message}`;
        } else {
          displayError = parsedErr.message || "Failed to process JSON.";
        }
        setError(displayError);
        setLoading(false);
      }
    }, 0);
  };

  // Restore rawInput and editorFontSize from localStorage and execute analysis on page mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentInput = useJSONStore.getState().rawInput;
      if (!currentInput) {
        const savedInput = localStorage.getItem("json_formatter_raw_input");
        if (savedInput && savedInput.trim()) {
          setRawInput(savedInput);
          runAnalysis(savedInput);
        }
      } else {
        // If rawInput was already populated (e.g. from the shared link route), format it immediately on load
        runAnalysis(currentInput);
      }

      // Restore saved editor font size
      const savedFontSize = localStorage.getItem("json_formatter_font_size");
      if (savedFontSize) {
        setEditorFontSize(Number(savedFontSize));
      }
    }
  }, [setRawInput, setEditorFontSize]);

  // Lazy computation for XML and CSV formats (only computed when active)
  useEffect(() => {
    if (!parsedJSON) return;

    if (viewMode === "xml" && xmlOutput === null) {
      const xml = convertJSONToXML(parsedJSON);
      useJSONStore.setState({ xmlOutput: xml });
    } else if (viewMode === "csv" && csvOutput === null) {
      const csv = convertJSONToCSV(parsedJSON);
      useJSONStore.setState({ csvOutput: csv });
    }
  }, [viewMode, parsedJSON, xmlOutput, csvOutput]);

  // Handle typing inside Monaco Editor
  const handleEditorChange = (value: string) => {
    setRawInput(value);
    setLoading(true);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      runAnalysis(value);
    }, 450); // Debounce formatting to prevent UI lag on massive inputs
  };

  // Immediate Action Handlers (Format, Minify, Repair)
  const triggerImmediateAction = () => {
    if (!rawInput.trim()) return;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    runAnalysis(rawInput);
  };

  const handleFormat = () => {
    triggerImmediateAction();
  };

  const handleTrashClick = () => {
    if (activeShareId) {
      setIsDeleteShareModalOpen(true);
    } else {
      clearAll();
    }
  };

  const executeCloudDelete = async () => {
    if (!activeShareId) return;
    setIsDeletingShare(true);
    setShareError("");

    try {
      const historyStr = localStorage.getItem("json_formatter_history");
      const history = historyStr ? JSON.parse(historyStr) : [];
      const item = history.find((h: any) => h.id === activeShareId);

      if (!item) {
        throw new Error("You do not own this snippet. Local token missing.");
      }

      const { error } = await supabaseClient
        .from("json_formatter_snippets")
        .delete()
        .eq("id", activeShareId)
        .eq("creator_token", item.token);

      if (error) throw new Error(error.message);

      removeFromHistory(activeShareId);
      clearAll();
      setIsDeleteShareModalOpen(false);
      window.location.href = "/"; // Navigate cleanly away from /share route
    } catch (err: any) {
      setShareError(err.message);
    } finally {
      setIsDeletingShare(false);
    }
  };

  const loadHistoryData = async () => {
    const historyStr = localStorage.getItem("json_formatter_history");
    if (!historyStr) {
      setHistoryData([]);
      return;
    }
    const history = JSON.parse(historyStr);
    if (history.length === 0) {
      setHistoryData([]);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const ids = history.map((h: any) => h.id);
      const { data, error } = await supabaseClient
        .from("json_formatter_snippets")
        .select()
        .in("id", ids);

      if (!error && data) {
        // Merge local tokens with live data
        const enriched = data.map((d: any) => {
          const localItem = history.find((h: any) => h.id === d.id);
          return {
            ...d,
            token: localItem?.token,
            local_created_at: localItem?.created_at
          };
        });
        // Sort by local created descending
        enriched.sort((a: any, b: any) => new Date(b.local_created_at).getTime() - new Date(a.local_created_at).getTime());
        setHistoryData(enriched);
      }
    } catch (err) {
      console.error("Failed to load history data", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryModalOpen) {
      loadHistoryData();
    }
  }, [isHistoryModalOpen]);

  const executeHistoryDelete = async (id: string, token: string) => {
    try {
      await supabaseClient
        .from("json_formatter_snippets")
        .delete()
        .eq("id", id)
        .eq("creator_token", token);

      removeFromHistory(id);
      setHistoryData((prev) => prev.filter((item) => item.id !== id));
      if (activeShareId === id) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Failed to delete snippet", err);
    }
  };

  const handleMinify = () => {
    setViewMode("formatted");
    triggerImmediateAction();
  };

  const handleRepair = () => {
    triggerImmediateAction();
  };

  const handleCopy = () => {
    let contentToCopy = "";
    if (viewMode === "formatted") contentToCopy = formattedOutput;
    else if (viewMode === "xml") contentToCopy = xmlOutput || "";
    else if (viewMode === "csv") contentToCopy = csvOutput || "";
    else if (viewMode === "tree") contentToCopy = JSON.stringify(parsedJSON, null, 2);
    else if (viewMode === "yaml") contentToCopy = parsedJSON ? YAML.stringify(parsedJSON) : "";
    else if (viewMode === "types") {
      if (parsedJSON) {
        if (targetLanguage === "typescript") contentToCopy = jsonToTypeScript(parsedJSON);
        else if (targetLanguage === "go") contentToCopy = jsonToGo(parsedJSON);
        else if (targetLanguage === "rust") contentToCopy = jsonToRust(parsedJSON);
        else if (targetLanguage === "python") contentToCopy = jsonToPython(parsedJSON);
        else if (targetLanguage === "java") contentToCopy = jsonToJava(parsedJSON);
      }
    }
    else if (viewMode === "schema") contentToCopy = schemaInput;
    else if (viewMode === "query") {
      if (parsedJSON && queryInput.trim()) {
        try {
          const res = JSONPath({ path: queryInput, json: parsedJSON });
          contentToCopy = JSON.stringify(res, null, indent);
        } catch { }
      }
    }
    else if (viewMode === "escaped") contentToCopy = escapedLocal;
    else if (viewMode === "decoder") {
      if (decodedResult) {
        contentToCopy = decodedResult.payload
          ? JSON.stringify(decodedResult.payload, null, 2)
          : decodedResult.rawPayload || "";
      }
    }

    if (!contentToCopy) return;

    navigator.clipboard.writeText(contentToCopy);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  // Zero-Knowledge Sharing Action
  const handleShareSubmit = async () => {
    if (!rawInput.trim()) return;
    setIsSharing(true);
    setShareError("");
    setShareLink("");

    try {
      const payload = minifiedOutput || JSON.stringify(parsedJSON) || rawInput;

      // 1. Client-Side Encryption
      const { ciphertext, iv, keyStr } = await encryptJSON(payload);

      const creator_token = typeof window !== "undefined" ? window.crypto.randomUUID() : "client-token";

      // 2. Upload only encrypted ciphertext, IV and creator_token to Supabase
      const { data, error: dbError } = await supabaseClient
        .from("json_formatter_snippets")
        .insert([
          {
            encrypted_content: ciphertext,
            iv: iv,
            language: "json",
            creator_token: creator_token,
          },
        ])
        .select();

      if (dbError) {
        throw new Error(dbError.message);
      }

      const id = data?.[0]?.id;
      if (!id) {
        throw new Error("Did not receive snippet record ID back from storage.");
      }

      // 3. Construct zero-knowledge URL: Key appended as URL Fragment Hash
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const shareUrl = `${origin}/share/${id}#key=${keyStr}`;
      setShareLink(shareUrl);

      // 4. Save to Local History for Dashboard
      // Prefer server returned token if trigger exists, else use our generated one
      const token = data?.[0]?.creator_token || creator_token;
      if (token) {
        useJSONStore.getState().addToHistory(id, token);
      }
    } catch (err: any) {
      console.error(err);
      setShareError(`Sharing failed: ${err.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  // Helper to format file size cleanly
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };


  return (
    <div className="flex flex-col bg-zinc-950 text-zinc-100 font-sans h-dvh overflow-hidden">
      {/* JSON-LD Structured Data for Search Engine Rich Cards */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "JSONObject.OnLine",
            "url": "https://jsonobject.online",
            "description": "Secure, client-side, zero-knowledge JSON validator, formatter, schema validator, type generator, and sharing utility platform.",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript. Requires Web Crypto API.",
          }),
        }}
      />
      {/* Top Main Navigation Header */}
      <header className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="group relative flex items-center space-x-3 focus:outline-none cursor-pointer text-left"
          aria-label="Reload application"
        >
          {/* Logo container with micro-animations */}
          <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-900/50 border border-zinc-800/80 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-500/40 group-hover:shadow-lg group-hover:shadow-cyan-500/10 group-active:scale-95">
            <img
              src="/logo-green.png"
              alt="JSONObject.OnLine Logo"
              className="h-7 w-7 object-contain select-none transition-transform duration-500 ease-out group-hover:rotate-[15deg]"
            />
          </div>
          {/* Title & Subtitle with micro-animations */}
          <div>
            <h1 className="font-semibold text-base tracking-wide bg-gradient-to-r from-zinc-100 to-zinc-400 group-hover:from-white group-hover:to-cyan-400 bg-clip-text text-transparent transition-all duration-300">
              JSONObject.OnLine
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 group-hover:text-cyan-500/80 transition-colors duration-300">
              ENCRYPTED JSON SHARER
            </p>
          </div>

        </button>

        {/* Central Notification Area */}
        <div className="hidden sm:flex flex-1 justify-center items-center px-4">
          {!isOnline ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 backdrop-blur-md shadow-lg shadow-red-500/5 animate-in fade-in slide-in-from-top-2 duration-300 whitespace-nowrap">
              <span className="relative flex h-2 w-2 flex-shrink-0 items-center justify-center mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-block rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-[9px] font-semibold tracking-wide uppercase font-mono">
                Offline Mode: Snippet sharing disabled
              </span>
            </div>
          ) : showLandingMessage ? (
            <div className="flex items-center space-x-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/5 animate-in fade-in slide-in-from-top-2 duration-500 ease-out whitespace-nowrap">
              <span className="relative flex h-2 w-2 flex-shrink-0 items-center justify-center mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-block rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              <span className="text-cyan-400 text-[11px] font-semibold tracking-wide uppercase font-mono">
                <span>Your data stays in your browser only</span>
                <span className="hidden md:inline">; we don’t save it anywhere else. Expect your share.</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLandingMessage(false);
                }}
                className="ml-2 p-0.5 rounded-full hover:bg-cyan-500/20 text-cyan-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss message"
                aria-label="Dismiss landing message"
              >
                <X size={12} />
              </button>
            </div>
          ) : systemWarning ? (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300 whitespace-nowrap">
              <span className="relative flex h-2 w-2 flex-shrink-0 items-center justify-center mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-block rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className="text-amber-400 text-[9px] font-semibold tracking-wide uppercase">
                {systemWarning}
              </span>
            </div>
          ) : null}
        </div>

        {/* Desktop Action Button Bar */}
        <div className="hidden lg:flex items-center space-x-1 lg:space-x-2">
          <button
            onClick={handleFormat}
            disabled={!rawInput.trim()}
            className="flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-md border border-zinc-850 hover:border-cyan-500/30 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-cyan-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Parse and format JSON"
            aria-label="Format JSON payload"
          >
            <AlignLeft size={13} />
            <span className="hidden md:inline">Format</span>
          </button>

          <button
            onClick={handleMinify}
            disabled={!rawInput.trim()}
            className="flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-md border border-zinc-850 hover:border-violet-500/30 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-violet-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Minify JSON"
            aria-label="Minify JSON payload"
          >
            <Minimize2 size={13} />
            <span className="hidden md:inline">Minify</span>
          </button>

          <button
            onClick={handleRepair}
            disabled={!rawInput.trim()}
            className="flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-md border border-zinc-850 hover:border-pink-500/30 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-pink-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Auto-repair LLM/malformed JSON"
            aria-label="Auto repair malformed JSON syntax"
          >
            <Sparkles size={13} className="text-pink-500" />
            <span className="hidden md:inline">Auto-Repair</span>
          </button>

          <div className="w-px h-5 bg-zinc-800 my-auto mx-0.5 lg:mx-1"></div>

          <button
            onClick={() => setHistoryModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-md border border-zinc-850 hover:border-cyan-500/30 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-cyan-400 transition-all cursor-pointer"
            title="My Shared Snippets"
            aria-label="View history of shared snippets"
          >
            <History size={13} />
            <span className="hidden md:inline">History</span>
          </button>

          <div className="w-px h-5 bg-zinc-800 my-auto mx-0.5 lg:mx-1"></div>

          {/* Dynamic Font Size Control */}
          <div
            className="flex items-center space-x-1 rounded-md border border-zinc-850 bg-zinc-900/50 px-1 py-0.5"
            title="Adjust Editor Font Size"
          >
            <button
              onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))}
              disabled={editorFontSize <= 10}
              className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 disabled:opacity-35 disabled:hover:text-zinc-500 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all"
              aria-label="Decrease Font Size"
            >
              <Minus size={11} />
            </button>
            <span className="text-[10px] font-mono font-semibold text-zinc-300 px-1 select-none min-w-[40px] text-center">
              {editorFontSize}px
            </span>
            <button
              onClick={() => setEditorFontSize(Math.min(26, editorFontSize + 1))}
              disabled={editorFontSize >= 26}
              className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 disabled:opacity-35 disabled:hover:text-zinc-500 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all"
              aria-label="Increase Font Size"
            >
              <Plus size={11} />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-800 my-auto mx-0.5 lg:mx-1"></div>

          <button
            onClick={handleTrashClick}
            disabled={!rawInput}
            className="p-2 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={activeShareId ? "Delete Shared Snippet" : "Clear all inputs"}
            aria-label="Clear raw workspace inputs"
          >
            <Trash2 size={15} className={activeShareId ? "text-red-400" : ""} />
          </button>

          <div title={!isOnline ? "Sharing requires an internet connection" : systemWarning || "Share encrypted JSON"}>
            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={!rawInput.trim() || !!error || !!systemWarning || !isOnline}
              className="flex items-center space-x-1.5 px-3 lg:px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              aria-label="Share encrypted JSON"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Mobile Action Menu Container */}
        <div className="flex items-center lg:hidden relative">
          {/* Mobile Sliding Menu Overlay */}
          <div
            className={`absolute right-12 h-10 bg-zinc-900/95 border border-zinc-800/80 backdrop-blur-md flex items-center justify-start px-3 space-x-2 rounded-lg shadow-xl shadow-black/40 overflow-x-auto scrollbar-none transition-all duration-300 ease-in-out z-25 origin-right ${isMobileMenuOpen
              ? "translate-x-0 opacity-100 pointer-events-auto w-[calc(100vw-80px)] max-w-[360px] scale-100"
              : "translate-x-4 opacity-0 pointer-events-none w-0 scale-90"
              }`}
          >
            <button
              onClick={() => {
                handleFormat();
                setIsMobileMenuOpen(false);
              }}
              disabled={!rawInput.trim()}
              className="p-2 rounded-md border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-cyan-400 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
              title="Format JSON"
              aria-label="Format JSON"
            >
              <AlignLeft size={14} />
            </button>

            <button
              onClick={() => {
                handleMinify();
                setIsMobileMenuOpen(false);
              }}
              disabled={!rawInput.trim()}
              className="p-2 rounded-md border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-violet-400 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
              title="Minify JSON"
              aria-label="Minify JSON"
            >
              <Minimize2 size={14} />
            </button>

            <button
              onClick={() => {
                handleRepair();
                setIsMobileMenuOpen(false);
              }}
              disabled={!rawInput.trim()}
              className="p-2 rounded-md border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-pink-400 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
              title="Auto-Repair LLM JSON"
              aria-label="Auto-Repair JSON"
            >
              <Sparkles size={14} className="text-pink-500" />
            </button>

            <div className="w-px h-5 bg-zinc-800 my-auto flex-shrink-0"></div>

            <button
              onClick={() => {
                setHistoryModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded-md border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-cyan-400 hover:scale-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              title="History"
              aria-label="History"
            >
              <History size={14} />
            </button>

            <div className="w-px h-5 bg-zinc-800 my-auto flex-shrink-0"></div>

            {/* Font size control */}
            <div className="flex items-center space-x-1 rounded-md border border-zinc-800 bg-zinc-950/40 px-1 py-0.5 flex-shrink-0">
              <button
                onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))}
                disabled={editorFontSize <= 10}
                className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-850 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease Font Size"
              >
                <Minus size={10} />
              </button>
              <span className="text-[9px] font-mono font-semibold text-zinc-300 px-0.5 select-none w-8 text-center">
                {editorFontSize}px
              </span>
              <button
                onClick={() => setEditorFontSize(Math.min(26, editorFontSize + 1))}
                disabled={editorFontSize >= 26}
                className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-850 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase Font Size"
              >
                <Plus size={10} />
              </button>
            </div>

            <div className="w-px h-5 bg-zinc-800 my-auto flex-shrink-0"></div>

            <button
              onClick={() => {
                handleTrashClick();
                setIsMobileMenuOpen(false);
              }}
              disabled={!rawInput}
              className="p-2 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-red-400 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
              title={activeShareId ? "Delete Shared Snippet" : "Clear all"}
              aria-label="Clear all"
            >
              <Trash2 size={14} className={activeShareId ? "text-red-400" : ""} />
            </button>

            <button
              onClick={() => {
                setIsShareModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              disabled={!rawInput.trim() || !!error || !!systemWarning || !isOnline}
              className="p-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
              title={!isOnline ? "Sharing requires an internet connection" : "Share encrypted JSON"}
              aria-label="Share"
            >
              <Share2 size={14} />
            </button>
          </div>

          {/* Animated Hamburger / Close Button Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative h-10 w-10 flex flex-col justify-center items-center rounded-lg border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-cyan-400 z-30 transition-all cursor-pointer focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <div className="flex flex-col justify-between w-5 h-3.5 transform transition-all duration-300">
              <span className={`h-0.5 w-full bg-current rounded transform transition-all duration-300 origin-center ${isMobileMenuOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
              <span className={`h-0.5 w-full bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`h-0.5 w-full bg-current rounded transform transition-all duration-300 origin-center ${isMobileMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden w-full px-4 pt-3 pb-1 flex-shrink-0 select-none bg-zinc-950">
        <div className="flex w-full bg-zinc-900/40 p-1 rounded-lg border border-zinc-900">
          <button
            onClick={() => setMobileTab("input")}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${mobileTab === "input"
              ? "bg-zinc-800 text-cyan-400 shadow"
              : "text-zinc-400 hover:text-zinc-200"
              }`}
            aria-label="Switch to Input Panel"
          >
            <Code size={14} />
            <span>Input JSON</span>
            {rawInput.trim() && (
              <span className="text-[10px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                {formatBytes(new Blob([rawInput]).size)}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileTab("output")}
            className={`flex-grow flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 relative cursor-pointer ${mobileTab === "output"
              ? "bg-zinc-800 text-cyan-400 shadow"
              : "text-zinc-400 hover:text-zinc-200"
              }`}
            aria-label="Switch to Output Panel"
          >
            <Braces size={14} />
            <span>Output View</span>
            {/* Status Ping Indicator */}
            {rawInput.trim() && (
              <span className="absolute top-2.5 right-3 flex h-2 w-2">
                {error ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </>
                ) : repaired ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                )}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Section */}
      <main ref={containerRef} className="flex-grow flex flex-col lg:flex-row p-3 lg:p-6 lg:pt-6 lg:pb-2 gap-0 overflow-hidden min-h-0 w-full max-w-full">

        {/* Left Pane - Input Staging Editor Area */}
        <section
          className={`flex-col h-full min-h-0 ${isDesktop || mobileTab === "input" ? "flex" : "hidden"
            }`}
          style={{ width: isDesktop ? `${leftWidth}%` : "100%" }}
        >
          <div className="flex items-center justify-between mb-2 px-1 select-none">
            <span className="text-xs font-mono tracking-widest text-zinc-500 font-semibold uppercase">
              Raw Input JSON
            </span>
            <div className="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
              <span>Indent:</span>
              <select
                value={indent}
                onChange={(e) => {
                  const newIndent = Number(e.target.value);
                  setIndent(newIndent);
                  if (rawInput.trim()) {
                    setLoading(true);
                    setTimeout(() => {
                      runAnalysis(rawInput);
                    }, 0);
                  }
                }}
                className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">1 Tab</option>
              </select>
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            <JSONEditor value={rawInput} onChange={handleEditorChange} />
          </div>

          {/* Footer Metrics Status Bar (Subtle, VS Code Style) */}
          <footer className="h-7 border border-t-0 border-zinc-800/80 bg-zinc-950 rounded-b-lg flex items-center justify-between px-3 text-[11px] font-mono text-zinc-500 select-none">
            <div className="flex items-center space-x-4 overflow-x-auto scrollbar-none flex-nowrap mr-2">
              {metrics ? (
                <>
                  <span className="flex-shrink-0" title="File size in bytes">{formatBytes(metrics.sizeBytes)}</span>
                  <span className="w-px h-3 bg-zinc-800 flex-shrink-0"></span>
                  <span className="flex-shrink-0" title="Total key-value counts">{metrics.keyCount} keys</span>
                  <span className="w-px h-3 bg-zinc-800 flex-shrink-0"></span>
                  <span className="flex-shrink-0" title="Total array structures">{metrics.arrayCount} arrays</span>
                  <span className="w-px h-3 bg-zinc-800 flex-shrink-0"></span>
                  <span className="flex-shrink-0" title="Total AST Nodes (Primitives + Objects + Arrays)">{metrics.nodeCount} nodes</span>
                  <span className="w-px h-3 bg-zinc-800 flex-shrink-0"></span>
                  <span className="flex-shrink-0" title="Maximum Nesting Depth">depth: {metrics.maxDepth}</span>
                </>
              ) : (
                <span className="flex-shrink-0">Empty Payload</span>
              )}
            </div>
            <div className="flex-shrink-0">
              <span>Ln {cursorLine}, Col {cursorCol}</span>
            </div>
          </footer>
        </section>

        {/* Resizable Divider Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden lg:flex w-4 items-center justify-center cursor-col-resize hover:bg-cyan-500/5 select-none relative group transition-colors duration-150 h-full min-h-0"
          role="separator"
          aria-label="Panel Splitter"
        >
          {/* Thin dividing line */}
          <div className="w-[1px] h-full bg-zinc-900 group-hover:bg-cyan-500/30 transition-colors duration-150"></div>
          {/* Tactile Capsule */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 group-hover:bg-cyan-400 group-hover:border-cyan-400 group-hover:h-12 transition-all duration-150"></div>
        </div>

        {/* Right Pane - Output Viewer / Transformation Tab Area */}
        <section
          ref={rightPaneRef}
          className={`relative flex-col bg-zinc-950 transition-all ${isDesktop || mobileTab === "output" ? "flex" : "hidden"
            } ${isFullscreen
              ? "w-full h-full p-6"
              : "h-full min-h-0"
            }`}
          style={isFullscreen ? {} : { width: isDesktop ? `${100 - leftWidth}%` : "100%" }}
        >
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-2 min-h-6 overflow-hidden max-w-full select-none">
            <div className="relative flex-grow mr-2 overflow-hidden flex items-center">
              <div className="flex space-x-1 p-0.5 bg-zinc-900/50 border border-zinc-900 rounded-lg overflow-x-auto scrollbar-none flex-nowrap w-full items-center">

                {/* Formatted Tab (Always visible) */}
                <button
                  onClick={() => setViewMode("formatted")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all cursor-pointer flex-shrink-0 ${viewMode === "formatted"
                    ? "bg-zinc-800 text-cyan-400 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  <Code size={13} />
                  <span>Formatted</span>
                </button>

                {/* More / Less Toggle Button (Mobile only) */}
                <button
                  onClick={() => setIsMoreViewsOpen(!isMoreViewsOpen)}
                  className="flex lg:hidden items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer flex-shrink-0 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400"
                >
                  <span>{isMoreViewsOpen ? "Less" : "More"}</span>
                  {isMoreViewsOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </button>

                {/* Hidden Views Container (Mobile sliding transition, Desktop always flex) */}
                <div
                  className={`flex items-center space-x-1 transition-all duration-500 ease-in-out lg:flex lg:max-w-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto ${isMoreViewsOpen
                    ? "max-w-[800px] opacity-100 translate-x-0 pointer-events-auto"
                    : "max-w-0 opacity-0 translate-x-4 overflow-hidden pointer-events-none"
                    }`}
                >
                  {[
                    { id: "tree", label: "Tree", icon: <TreeDeciduous size={13} /> },
                    { id: "yaml", label: "YAML", icon: <FileCode size={13} /> },
                    { id: "xml", label: "XML", icon: <FileCode size={13} /> },
                    { id: "csv", label: "CSV", icon: <Table size={13} /> },
                    { id: "types", label: "Types", icon: <FileCode size={13} /> },
                    { id: "schema", label: "Schema", icon: <Braces size={13} /> },
                    { id: "query", label: "Query", icon: <Search size={13} /> },
                    { id: "diff", label: "Diff", icon: <GitCompare size={13} /> },
                    { id: "escaped", label: "Escaped", icon: <Quote size={13} /> },
                    { id: "decoder", label: "JWT/B64", icon: <Key size={13} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setViewMode(tab.id as ViewMode)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all cursor-pointer flex-shrink-0 ${viewMode === tab.id
                        ? "bg-zinc-800 text-cyan-400 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Fade out mask at the right edge to indicate horizontal scroll */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none lg:hidden"></div>
            </div>

            {/* Output Panel Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {rawInput.trim() && !error && (
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center space-x-1 px-3 py-1.5 lg:px-3 lg:py-1.5 max-lg:p-2 rounded border border-zinc-850 hover:border-cyan-500/30 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  title="Copy formatted JSON output"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 hidden lg:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="hidden lg:inline">Copy</span>
                    </>
                  )}
                </button>
              )}

              {rawInput.trim() && (
                <button
                  onClick={clearAll}
                  className="flex items-center justify-center space-x-1 px-3 py-1 lg:px-3 lg:py-1 max-lg:p-2 rounded border border-zinc-850 hover:border-red-500/30 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  title="Clear JSON from editor and local storage"
                >
                  <Trash2 size={12} />
                  <span className="hidden lg:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Output Display Container */}
          <div className="flex-1 min-h-0 relative rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950 flex flex-col">

            {/* Auto-Repaired Alert */}
            {repaired && repairedMessage && !error && (
              <div className="bg-emerald-950/30 border-b border-emerald-800/30 px-4 py-2 flex items-start space-x-2 text-xs text-emerald-400 font-mono select-none">
                <Info size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                <span>{repairedMessage}</span>
              </div>
            )}

            {/* Error Message Panel */}
            {error && (
              <div className="bg-red-950/20 border-b border-red-900/30 px-4 py-3 flex items-start space-x-3 text-xs text-red-400 font-mono select-none">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold text-red-500 mb-0.5">JSON Parsing Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] flex items-center justify-center z-10 select-none">
                <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-lg shadow-xl shadow-black/40">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                </div>
              </div>
            )}

            {/* Dynamic Viewer Render */}
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              {viewMode === "formatted" && (
                <JSONEditor value={formattedOutput} onChange={() => { }} readOnly={true} />
              )}
              {viewMode === "tree" && (
                <JSONTreeView data={parsedJSON} />
              )}
              {viewMode === "yaml" && (
                <pre
                  className="w-full h-full p-4 overflow-auto font-mono text-cyan-400 bg-zinc-950 whitespace-pre-wrap select-text"
                  style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                >
                  {systemWarning ? (
                    <span className="text-amber-500 block text-center mt-10">
                      ⚠️ YAML generation is disabled for payloads over 1.5MB to prevent the browser from freezing.
                    </span>
                  ) : parsedJSON ? YAML.stringify(parsedJSON) : (
                    <span className="text-zinc-600 italic">No converted YAML payload ready.</span>
                  )}
                </pre>
              )}
              {viewMode === "xml" && (
                <pre
                  className="w-full h-full p-4 overflow-auto font-mono text-emerald-400 bg-zinc-950 whitespace-pre-wrap select-text"
                  style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                >
                  {xmlOutput || (
                    <span className="text-zinc-600 italic">No converted XML payload ready.</span>
                  )}
                </pre>
              )}
              {viewMode === "csv" && (
                <pre
                  className="w-full h-full p-4 overflow-auto font-mono text-amber-400 bg-zinc-950 whitespace-pre-wrap select-text"
                  style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                >
                  {csvOutput || (
                    <span className="text-zinc-600 italic">No converted CSV payload ready.</span>
                  )}
                </pre>
              )}
              {viewMode === "types" && (
                <div className="w-full h-full flex flex-col bg-zinc-950">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400">Target Language:</span>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as CodeLanguage)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="python">Python (Pydantic)</option>
                      <option value="java">Java (Jackson)</option>
                    </select>
                  </div>
                  <div className="flex-1 min-h-0">
                    <JSONEditor
                      value={
                        parsedJSON
                          ? targetLanguage === "typescript"
                            ? jsonToTypeScript(parsedJSON)
                            : targetLanguage === "go"
                              ? jsonToGo(parsedJSON)
                              : targetLanguage === "rust"
                                ? jsonToRust(parsedJSON)
                                : targetLanguage === "python"
                                  ? jsonToPython(parsedJSON)
                                  : jsonToJava(parsedJSON)
                          : ""
                      }
                      onChange={() => { }}
                      readOnly={true}
                    />
                  </div>
                </div>
              )}
              {viewMode === "schema" && (
                <div className="w-full h-full flex flex-col bg-zinc-950">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
                    <span className="text-xs font-mono text-zinc-400">JSON Schema Sandbox (Draft-07)</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleResetSchema}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        Reset Schema
                      </button>
                      <button
                        onClick={handleValidateSchema}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Validate Workspace JSON
                      </button>
                    </div>
                  </div>
                  {schemaError && (
                    <div className="bg-red-950/20 border-b border-red-900/30 px-4 py-2 text-xs text-red-400 font-mono whitespace-pre-wrap select-text leading-5">
                      {schemaError}
                    </div>
                  )}
                  {schemaSuccess && (
                    <div className="bg-emerald-950/20 border-b border-emerald-900/30 px-4 py-2 text-xs text-emerald-400 font-mono select-none">
                      ✓ Workspace JSON validates successfully against this schema!
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <JSONEditor value={schemaInput} onChange={setSchemaInput} readOnly={false} />
                  </div>
                </div>
              )}
              {viewMode === "query" && (
                <div className="w-full h-full flex flex-col bg-zinc-950">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <Search size={14} className="text-zinc-500" />
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Enter JSONPath query (e.g. $.store.book[*].author)"
                      className="flex-grow bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div className="flex-grow min-h-0">
                    <JSONEditor
                      value={
                        parsedJSON
                          ? (() => {
                            if (!queryInput.trim()) return "Enter a valid JSONPath query above.";
                            try {
                              const res = JSONPath({ path: queryInput, json: parsedJSON });
                              return JSON.stringify(res, null, indent);
                            } catch (err: any) {
                              return `Query Error: ${err.message}`;
                            }
                          })()
                          : ""
                      }
                      onChange={() => { }}
                      readOnly={true}
                    />
                  </div>
                </div>
              )}
              {viewMode === "diff" && (
                <div className="w-full h-full flex flex-col bg-zinc-950">
                  <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500 font-mono select-none">
                    COMPARE JSON: LEFT PANE (WORKSPACE ORIGINAL) vs RIGHT PANE (MODIFIED FOR COMPARISON)
                  </div>
                  <div className="flex-grow min-h-0 relative">
                    <DiffEditor
                      height="100%"
                      original={formattedOutput || ""}
                      modified={diffInput}
                      language="json"
                      theme="vs-dark"
                      onMount={handleDiffEditorMount}
                      options={{
                        originalEditable: false,
                        readOnly: false,
                        minimap: { enabled: false },
                        fontSize: editorFontSize,
                        fontFamily: "var(--font-mono), monospace",
                        lineHeight: Math.round(editorFontSize * 1.02),
                        automaticLayout: true,
                        scrollbar: {
                          vertical: "visible",
                          horizontal: "visible",
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8,
                        },
                      }}
                    />
                  </div>
                </div>
              )}
              {viewMode === "escaped" && (
                <div className="w-full h-full flex flex-col bg-zinc-950 p-4 space-y-4 overflow-y-auto">
                  <div className="space-y-1.5 select-none">
                    <h4 className="text-xs font-mono font-semibold text-zinc-300">Escaped JSON String</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      This represents the current workspace JSON escaped as a single-line string.
                    </p>
                    <textarea
                      readOnly
                      value={escapedLocal}
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-3 text-cyan-400 font-mono outline-none select-text resize-none"
                      style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(escapedLocal);
                      }}
                      className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium cursor-pointer transition-colors"
                    >
                      Copy Escaped String
                    </button>
                  </div>

                  <div className="h-[1px] bg-zinc-900"></div>

                  <div className="space-y-1.5 select-none">
                    <h4 className="text-xs font-mono font-semibold text-zinc-300">Unescape Escaped String</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Paste an escaped string below to parse it and load it back into the main workspace.
                    </p>
                    <textarea
                      id="unescapeInput"
                      placeholder="Paste escaped string here..."
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-3 text-zinc-300 font-mono outline-none focus:border-cyan-500 resize-none"
                      style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                    />
                    <button
                      onClick={() => {
                        const val = (document.getElementById("unescapeInput") as HTMLTextAreaElement)?.value || "";
                        handleUnescapeAction(val);
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Unescape & Load to Workspace
                    </button>
                  </div>
                </div>
              )}
              {viewMode === "decoder" && (
                <div className="w-full h-full flex flex-col bg-zinc-950 p-4 space-y-4 overflow-y-auto">
                  <div className="space-y-1.5 select-none">
                    <h4 className="text-xs font-mono font-semibold text-zinc-300">JWT or Base64 Decoder</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Paste a JWT token or a Base64-encoded string. It will be decoded client-side.
                    </p>
                    <textarea
                      value={decoderInput}
                      onChange={(e) => handleDecodeToken(e.target.value)}
                      placeholder="Paste JWT token or Base64 string here..."
                      className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded p-3 text-zinc-300 font-mono outline-none focus:border-cyan-500 resize-none"
                      style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                    />
                  </div>

                  {decodedResult && (
                    <div className="flex-1 space-y-4 font-mono select-none">
                      {decodedResult.error ? (
                        <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-3 rounded">
                          {decodedResult.error}
                        </div>
                      ) : (
                        <>
                          {decodedResult.isJWT && decodedResult.header && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">JWT Header</span>
                              <pre
                                className="bg-zinc-900 border border-zinc-850 rounded p-3 text-pink-400 overflow-x-auto select-text"
                                style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                              >
                                {JSON.stringify(decodedResult.header, null, 2)}
                              </pre>
                            </div>
                          )}
                          {(decodedResult.payload || decodedResult.rawPayload) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                  {decodedResult.isJWT ? "JWT Payload" : "Decoded Content"}
                                </span>
                                <button
                                  onClick={handleLoadDecodedToWorkspace}
                                  className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/30 text-cyan-400 hover:text-white rounded text-[10px] font-medium transition-all cursor-pointer"
                                >
                                  Load to Main Workspace
                                </button>
                              </div>
                              <pre
                                className="bg-zinc-900 border border-zinc-850 rounded p-3 text-cyan-400 overflow-x-auto select-text"
                                style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
                              >
                                {decodedResult.payload
                                  ? JSON.stringify(decodedResult.payload, null, 2)
                                  : decodedResult.rawPayload}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fullscreen Floating Action Button inside Right Pane */}
            <div className="absolute bottom-4 right-4 z-30 group">
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 opacity-0 scale-95 origin-bottom-right group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen Output"}
              </div>
              {/* Button */}
              <button
                onClick={toggleFullscreen}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:scale-110 active:scale-95 shadow-lg shadow-black/40 hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
                aria-label="Toggle Fullscreen Mode"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Share Confirmation Overlay Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-5 sm:p-6 relative mx-4">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
              <Share2 size={16} className="text-cyan-500" />
              <span>Share Encrypted Snippet</span>
            </h3>

            {/* Database status warning inside modal */}
            {isSupabaseMocked && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg p-3 text-[11px] flex items-start space-x-2 font-mono">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <span>
                  Notice: No Supabase credentials configured. This snippet will be saved in your browser's mock LocalStorage database. The share URL will work locally on this device only.
                </span>
              </div>
            )}

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
              Are you OK to save this JSON securely?
              <br />
              The JSON will be encrypted in your browser using AES-GCM-256 before being sent to the database. Only individuals with the sharing link (containing the hash key fragment) will be able to retrieve and decrypt it. We never receive the decryption key.
            </p>

            {shareError && (
              <div className="mt-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg p-3 text-xs font-mono">
                {shareError}
              </div>
            )}

            {/* Formatted link display */}
            {shareLink && (
              <div className="mt-4">
                <label className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold block mb-1">
                  SECURE SHARE LINK
                </label>
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg select-all">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-transparent text-xs font-mono text-cyan-400 outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      // Visual temporary indication of copy success
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Copy Shared Link"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center space-x-1">
                  <Check size={10} />
                  <span>The decryption key is securely stored after the # symbol.</span>
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end space-x-3 text-xs">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareLink("");
                  setShareError("");
                }}
                disabled={isSharing}
                className="px-4 py-2.5 sm:py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                Close
              </button>

              {!shareLink && (
                <button
                  onClick={handleShareSubmit}
                  disabled={isSharing}
                  className="px-4 py-2.5 sm:py-2 bg-cyan-600 hover:bg-cyan-500 hover:shadow-md text-white rounded-md font-medium flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Yes, Encrypt & Share</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Shared Snippet Modal */}
      {isDeleteShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-5 sm:p-6 relative mx-4">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
              <Trash2 size={16} className="text-red-500" />
              <span>Delete Shared Snippet</span>
            </h3>

            <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
              You are viewing a shared snippet from the cloud.
            </p>

            {(() => {
              const historyStr = localStorage.getItem("json_formatter_history");
              const history = historyStr ? JSON.parse(historyStr) : [];
              const isOwner = history.some((h: any) => h.id === activeShareId);

              return (
                <div className="mt-4">
                  {isOwner ? (
                    <div className="bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg p-4 text-xs">
                      <p className="font-semibold mb-1 text-red-300">You are the Creator of this snippet.</p>
                      <p>Do you want to permanently delete it from the cloud server? This action cannot be undone.</p>
                    </div>
                  ) : (
                    <div className="bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-lg p-4 text-xs">
                      <p className="font-semibold mb-1 text-amber-300">You are a Viewer of this snippet.</p>
                      <p>You do not have the creator token to delete this from the cloud. You can only clear your local screen.</p>
                    </div>
                  )}

                  {shareError && (
                    <div className="mt-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg p-3 text-xs font-mono">
                      {shareError}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col space-y-2 text-xs">
                    {isOwner && (
                      <button
                        onClick={executeCloudDelete}
                        disabled={isDeletingShare}
                        className="w-full py-2.5 bg-red-900/60 hover:bg-red-800 border border-red-800/50 text-white rounded-md font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {isDeletingShare ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Delete from Cloud</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        clearAll();
                        setIsDeleteShareModalOpen(false);
                        window.location.href = "/";
                      }}
                      disabled={isDeletingShare}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md font-medium transition-all cursor-pointer"
                    >
                      Clear Local Editor Only
                    </button>
                    <button
                      onClick={() => {
                        setIsDeleteShareModalOpen(false);
                        setShareError("");
                      }}
                      disabled={isDeletingShare}
                      className="w-full py-2 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-300 rounded-md transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* History Dashboard Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm select-none animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col mx-4 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
                <History size={18} className="text-cyan-500" />
                <span>My Shared Snippets</span>
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                  <p className="text-sm">Fetching analytics from cloud...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <History size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-sm">You haven't shared any snippets from this browser yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {historyData.map((item) => (
                    <div key={item.id} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors group">

                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-xs font-mono text-cyan-400 font-semibold">{item.id.split("-")[0]}...</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            {new Date(item.local_created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <Eye size={12} className={item.views_count > 0 ? "text-emerald-400" : ""} />
                            <span>{item.views_count} view{item.views_count !== 1 && 's'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Clock size={12} />
                            <span>{item.last_viewed_at ? new Date(item.last_viewed_at).toLocaleString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={`/share/${item.id}`}
                          onClick={(e) => {
                            if (activeShareId === item.id) {
                              e.preventDefault();
                              setHistoryModalOpen(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors cursor-pointer text-center"
                        >
                          View
                        </a>
                        <button
                          onClick={() => {
                            if (window.confirm("Permanently delete this snippet from the cloud?")) {
                              executeHistoryDelete(item.id, item.token);
                            }
                          }}
                          className="px-2 py-1.5 border border-red-900/30 text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          title="Delete from Cloud"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-center">
              <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                History is tied to this browser device via an anonymous ownership token. Clearing local storage will result in loss of access to these snippets.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Subtle Animated Footer */}
      <footer className="premium-footer w-full py-3.5 flex flex-col md:flex-row items-center justify-between px-6 text-[10px] font-mono text-zinc-500 select-none cursor-default flex-shrink-0 border-t border-zinc-900 bg-zinc-950 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Left: Navigation links */}
        <div className="flex items-center space-x-4">
          <Link href="/faq" className="hover:text-cyan-400 transition-colors cursor-pointer">
            FAQ
          </Link>
          <span className="text-zinc-850">•</span>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors cursor-pointer font-sans select-none tracking-wide text-[10px] uppercase font-mono">
            Privacy Policy
          </Link>
        </div>

        {/* Center: GitHub Open Source Callout */}
        <div className="flex items-center justify-center">
          <a
            href="https://github.com/mushfiqweb/JSON_Formatter"
            target="_blank"
            rel="noopener noreferrer"
            className="group/github flex items-center space-x-2.5 px-3 py-1 rounded-full bg-zinc-900/50 hover:bg-cyan-500/10 border border-zinc-850 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-400 transition-all duration-300 shadow-md shadow-black/10 hover:shadow-cyan-500/5 cursor-pointer relative overflow-hidden"
            title="Give a Star on GitHub"
            aria-label="Give a Star on GitHub"
          >
            {/* Shimmer overlay effect on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover/github:animate-[shimmer_1.5s_infinite]" />
            
            <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16" aria-hidden="true">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="text-[10px] font-sans font-medium tracking-wide">
              It&#39;s an open source project on GitHub. Give it a star!
            </span>
            <span className="text-zinc-800 group-hover/github:text-cyan-500/30 transition-colors select-none">|</span>
            <span className="flex items-center space-x-1 font-sans text-[10px] font-semibold text-zinc-300 group-hover/github:text-cyan-300">
              <span>★</span>
              <span>{starCount !== null ? starCount : "Star"}</span>
            </span>
          </a>
        </div>

        {/* Right: Visitor time */}
        <span className="text-right">{visitorTime}</span>
      </footer>

      {/* Premium developer notifications */}
      <ToastContainer />
    </div>
  );
}
