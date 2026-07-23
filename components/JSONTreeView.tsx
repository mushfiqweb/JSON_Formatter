"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Search } from "lucide-react";
import { useJSONStore } from "@/store/store";

interface JSONTreeViewProps {
  data: any;
}

// Escapes special regex characters in queries
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Dynamic text highlighter wrapping matches in custom styled tags
function highlightText(text: string, highlight: string) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase().trim() ? (
          <mark key={i} className="bg-cyan-500/30 text-cyan-200 font-bold px-0.5 rounded border border-cyan-500/20 select-text">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

// Recursive check to see if a node or its children contains any match
function hasMatch(val: any, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase().trim();

  function check(node: any): boolean {
    if (node === null || node === undefined) return false;
    const type = typeof node;
    if (type !== "object") {
      return String(node).toLowerCase().includes(q);
    }
    if (Array.isArray(node)) {
      return node.some((item) => check(item));
    }
    return Object.entries(node).some(([key, val]) =>
      key.toLowerCase().includes(q) || check(val)
    );
  }

  return check(val);
}

export default function JSONTreeView({ data }: JSONTreeViewProps) {
  const editorFontSize = useJSONStore((state) => state.editorFontSize);
  const [searchQuery, setSearchQuery] = useState("");

  if (data === null || data === undefined) {
    return (
      <div
        className="flex items-center justify-center h-full text-zinc-500 font-mono"
        style={{ fontSize: `${editorFontSize}px` }}
      >
        No valid JSON data loaded.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      {/* Sticky Search bar for Tree Explorer */}
      <div className="flex items-center space-x-2.5 px-4 py-2 bg-zinc-900 border border-zinc-800/80 border-b-0 rounded-t-lg select-none">
        <Search size={13} className="text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search keys or values in tree..."
          className="flex-grow bg-transparent border-none text-xs text-zinc-200 outline-none font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div
        className="flex-grow overflow-y-auto p-6 font-mono bg-zinc-950 text-zinc-300 rounded-b-lg border border-zinc-800/80 select-text"
        style={{ fontSize: `${editorFontSize}px`, lineHeight: `${Math.round(editorFontSize * 1.57)}px` }}
      >
        <TreeNode name="root" value={data} depth={0} isLast={true} searchQuery={searchQuery} />
      </div>
    </div>
  );
}

interface TreeNodeProps {
  name: string | number;
  value: any;
  depth: number;
  isLast: boolean;
  searchQuery: string;
}

function TreeNode({ name, value, depth, isLast, searchQuery }: TreeNodeProps) {
  const editorFontSize = useJSONStore((state) => state.editorFontSize);
  const isMatchInSubtree = searchQuery ? hasMatch(value, searchQuery) : false;

  // Start with root expanded, other nodes collapsed by default for performance
  const [isExpanded, setIsExpanded] = useState<boolean>(depth === 0);
  const [copied, setCopied] = useState(false);

  // Force expand parent if match found in sub-nodes
  useEffect(() => {
    if (searchQuery && isMatchInSubtree) {
      setIsExpanded(true);
    }
  }, [searchQuery, isMatchInSubtree]);

  const type = typeof value;
  const isObject = value !== null && type === "object";
  const isArray = Array.isArray(value);
  const keyColorClass = isObject ? "text-sky-400" : "text-zinc-300";

  const copyNodeValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Render Primitive values
  if (!isObject) {
    let renderedValue = "";
    let valueColor = "";

    if (value === null) {
      renderedValue = "null";
      valueColor = "text-zinc-500 italic";
    } else if (type === "string") {
      renderedValue = `"${value}"`;
      valueColor = "text-cyan-400 break-all";
    } else if (type === "number") {
      renderedValue = String(value);
      valueColor = "text-violet-400";
    } else if (type === "boolean") {
      renderedValue = String(value);
      valueColor = "text-amber-400";
    }

    return (
      <div className="flex items-start py-0.5 hover:bg-zinc-900/50 rounded px-1 group transition-colors duration-100">
        {/* Visual spacer to align primitive values with expandable chevron keys */}
        <span
          className="flex-shrink-0 select-none"
          style={{ width: `${Math.max(20, Math.round(editorFontSize * 1.3))}px` }}
        />
        <span className={`${keyColorClass} font-semibold mr-1`}>
          {typeof name === "number" ? name : highlightText(`"${name}"`, searchQuery)}
        </span>
        <span className="text-zinc-600 mr-2 select-none">:</span>
        <span className={valueColor}>
          {type === "string" ? highlightText(`"${value}"`, searchQuery) : highlightText(String(value), searchQuery)}
        </span>
        {!isLast && <span className="text-zinc-600 select-none">,</span>}
      </div>
    );
  }

  // Handle Object or Array
  const keys = isArray ? [] : Object.keys(value);
  const size = isArray ? value.length : keys.length;
  const bracketOpen = isArray ? "[" : "{";
  const bracketClose = isArray ? "]" : "}";

  return (
    <div className="flex flex-col py-0.5">
      {/* Node Header */}
      <div
        className="flex items-center hover:bg-zinc-900/50 rounded px-1 cursor-pointer group transition-colors duration-100 py-0.5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Toggle Arrow */}
        <span
          className="text-zinc-500 hover:text-zinc-300 mr-1 select-none flex items-center justify-center flex-shrink-0"
          style={{ width: `${Math.max(20, Math.round(editorFontSize * 1.3))}px`, height: `${Math.max(20, Math.round(editorFontSize * 1.3))}px` }}
        >
          {isExpanded ? (
            <ChevronDown size={Math.max(10, Math.round(editorFontSize * 0.9))} className="text-zinc-500" />
          ) : (
            <ChevronRight size={Math.max(10, Math.round(editorFontSize * 0.9))} className="text-zinc-500" />
          )}
        </span>

        {/* Key name */}
        {name !== "root" && (
          <>
            <span className={`${keyColorClass} font-semibold mr-1`}>
              {typeof name === "number" ? name : highlightText(`"${name}"`, searchQuery)}
            </span>
            <span className="text-zinc-600 mr-2 select-none">:</span>
          </>
        )}

        {/* Opened/Closed Bracket & Meta stats */}
        <span className="text-zinc-400 font-semibold">{bracketOpen}</span>

        {!isExpanded && (
          <span
            className="text-zinc-600 mx-1 px-1 bg-zinc-900 border border-zinc-800 rounded select-none"
            style={{ fontSize: `${Math.max(8, Math.round(editorFontSize * 0.8))}px` }}
          >
            {isArray ? `${size} items` : `${size} keys`}
          </span>
        )}

        {!isExpanded && <span className="text-zinc-400 font-semibold">{bracketClose}</span>}

        {/* Copy subtree button */}
        <button
          onClick={copyNodeValue}
          className="ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 md:p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-cyan-400 transition-all duration-100 cursor-pointer flex-shrink-0"
          title="Copy node content"
        >
          {copied ? (
            <Check size={Math.max(8, Math.round(editorFontSize * 0.85))} className="text-emerald-400" />
          ) : (
            <Copy size={Math.max(8, Math.round(editorFontSize * 0.85))} />
          )}
        </button>

        {!isLast && !isExpanded && <span className="text-zinc-600 select-none">,</span>}
      </div>

      {/* Expanded Children */}
      {isExpanded && (
        <>
          <div className="border-l border-zinc-800/60 ml-2.5 pl-1">
            {isArray
              ? value.map((item: any, idx: number) => (
                  <TreeNode
                    key={idx}
                    name={idx}
                    value={item}
                    depth={depth + 1}
                    isLast={idx === size - 1}
                    searchQuery={searchQuery}
                  />
                ))
              : keys.map((key: string, idx: number) => (
                  <TreeNode
                    key={key}
                    name={key}
                    value={value[key]}
                    depth={depth + 1}
                    isLast={idx === size - 1}
                    searchQuery={searchQuery}
                  />
                ))}
          </div>
          <div className="flex items-center py-0.5">
            <span
              className="flex-shrink-0 select-none"
              style={{ width: `${Math.max(20, Math.round(editorFontSize * 1.3))}px` }}
            />
            <span className="text-zinc-400 font-semibold">{bracketClose}</span>
            {!isLast && <span className="text-zinc-600 select-none">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

