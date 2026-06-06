"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";


interface JSONTreeViewProps {
  data: any;
}

export default function JSONTreeView({ data }: JSONTreeViewProps) {
  if (data === null || data === undefined) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">
        No valid JSON data loaded.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 font-mono text-sm bg-zinc-950 text-zinc-300 rounded-lg border border-zinc-800 select-text">
      <TreeNode name="root" value={data} depth={0} isLast={true} />
    </div>
  );
}

interface TreeNodeProps {
  name: string | number;
  value: any;
  depth: number;
  isLast: boolean;
}

function TreeNode({ name, value, depth, isLast }: TreeNodeProps) {
  // Start with root expanded, other nodes collapsed by default for performance
  const [isExpanded, setIsExpanded] = useState<boolean>(depth === 0);
  const [copied, setCopied] = useState(false);

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
        <span className="text-zinc-500 select-none mr-2">{"  ".repeat(depth)}</span>
        <span className={`${keyColorClass} font-semibold mr-1`}>
          {typeof name === "number" ? name : `"${name}"`}
        </span>
        <span className="text-zinc-600 mr-2 select-none">:</span>
        <span className={valueColor}>{renderedValue}</span>
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
        <span className="text-zinc-500 select-none mr-1">{"  ".repeat(depth)}</span>
        
        {/* Toggle Arrow */}
        <span className="text-zinc-500 hover:text-zinc-300 mr-1 select-none flex items-center justify-center w-4 h-4">
          {isExpanded ? (
            <ChevronDown size={14} className="text-zinc-500" />
          ) : (
            <ChevronRight size={14} className="text-zinc-500" />
          )}
        </span>

        {/* Key name */}
        {name !== "root" && (
          <>
            <span className={`${keyColorClass} font-semibold mr-1`}>
              {typeof name === "number" ? name : `"${name}"`}
            </span>
            <span className="text-zinc-600 mr-2 select-none">:</span>
          </>
        )}

        {/* Opened/Closed Bracket & Meta stats */}
        <span className="text-zinc-400 font-semibold">{bracketOpen}</span>

        {!isExpanded && (
          <span className="text-zinc-600 text-xs mx-1 px-1 bg-zinc-900 border border-zinc-800 rounded select-none">
            {isArray ? `${size} items` : `${size} keys`}
          </span>
        )}

        {!isExpanded && <span className="text-zinc-400 font-semibold">{bracketClose}</span>}

        {/* Copy subtree button on hover */}
        <button
          onClick={copyNodeValue}
          className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-cyan-400 transition-all duration-100 cursor-pointer"
          title="Copy node content"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>

        {!isLast && !isExpanded && <span className="text-zinc-600 select-none">,</span>}
      </div>

      {/* Expanded Children (Rendered lazily for rendering speed!) */}
      {isExpanded && (
        <>
          <div className="border-l border-zinc-800/80 ml-2">
            {isArray
              ? value.map((item: any, idx: number) => (
                  <TreeNode
                    key={idx}
                    name={idx}
                    value={item}
                    depth={depth + 1}
                    isLast={idx === size - 1}
                  />
                ))
              : keys.map((key: string, idx: number) => (
                  <TreeNode
                    key={key}
                    name={key}
                    value={value[key]}
                    depth={depth + 1}
                    isLast={idx === size - 1}
                  />
                ))}
          </div>
          <div className="flex items-center">
            <span className="text-zinc-500 select-none mr-2">{"  ".repeat(depth)}</span>
            <span className="text-zinc-500 w-4 select-none"></span>
            <span className="text-zinc-400 font-semibold">{bracketClose}</span>
            {!isLast && <span className="text-zinc-600 select-none">,</span>}
          </div>
        </>
      )}
    </div>
  );
}
