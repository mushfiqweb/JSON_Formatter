import { jsonrepair } from "jsonrepair";
import { XMLBuilder } from "fast-xml-parser";
import { json2csv } from "json-2-csv";

export interface JSONMetrics {
  sizeBytes: number;
  nodeCount: number;
  keyCount: number;
  arrayCount: number;
  maxDepth: number;
}

// Traverse JSON to compute metrics (nodes, keys, arrays, depth)
export function computeJSONMetrics(val: any, byteSize: number = 0): JSONMetrics {
  let nodeCount = 0;
  let keyCount = 0;
  let arrayCount = 0;
  let maxDepth = 0;

  function traverse(node: any, depth: number) {
    if (depth > maxDepth) {
      maxDepth = depth;
    }
    nodeCount++;

    if (node === null || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      arrayCount++;
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], depth + 1);
      }
    } else {
      const keys = Object.keys(node);
      keyCount += keys.length;
      for (let i = 0; i < keys.length; i++) {
        traverse(node[keys[i]], depth + 1);
      }
    }
  }

  traverse(val, 0);

  return {
    sizeBytes: byteSize,
    nodeCount,
    keyCount,
    arrayCount,
    maxDepth,
  };
}

// Formats JSON with validation and automatic fallback to jsonrepair
export function repairAndFormatJSON(raw: string, indent: number = 2): { formatted: string; error?: string; repaired: boolean } {
  if (!raw.trim()) {
    return { formatted: "", repaired: false };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      formatted: JSON.stringify(parsed, null, indent),
      repaired: false,
    };
  } catch (err: any) {
    // Attempt jsonrepair
    try {
      const repairedStr = jsonrepair(raw);
      const parsedRep = JSON.parse(repairedStr);
      return {
        formatted: JSON.stringify(parsedRep, null, indent),
        repaired: true,
        error: `Syntax error automatically repaired: ${err.message}`,
      };
    } catch (repairErr: any) {
      return {
        formatted: raw,
        repaired: false,
        error: `Failed to parse or repair: ${err.message}. (Repair attempt failed: ${repairErr.message})`,
      };
    }
  }
}

// Minifies JSON
export function minifyJSON(raw: string): { minified: string; error?: string; repaired: boolean } {
  if (!raw.trim()) {
    return { minified: "", repaired: false };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      minified: JSON.stringify(parsed),
      repaired: false,
    };
  } catch (err: any) {
    try {
      const repairedStr = jsonrepair(raw);
      const parsedRep = JSON.parse(repairedStr);
      return {
        minified: JSON.stringify(parsedRep),
        repaired: true,
        error: `Syntax error automatically repaired: ${err.message}`,
      };
    } catch (repairErr: any) {
      return {
        minified: raw,
        repaired: false,
        error: `Failed to minify: ${err.message}`,
      };
    }
  }
}

// Convert JSON to XML
export function convertJSONToXML(jsonObj: any): string {
  try {
    // XML requires a single root element. If the jsonObj is an array or doesn't have a single root key,
    // we wrap it under a default <root> tag.
    let wrapObj = jsonObj;
    if (Array.isArray(jsonObj)) {
      wrapObj = { item: jsonObj };
    }
    const builder = new XMLBuilder({
      format: true,
      indentBy: "  ",
      ignoreAttributes: false,
    });
    const xml = builder.build(wrapObj);
    return xml.startsWith("<?xml") ? xml : `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xml}\n</root>`;
  } catch (err: any) {
    return `<!-- XML Conversion Error: ${err.message} -->`;
  }
}

// Convert JSON to CSV
export function convertJSONToCSV(jsonObj: any): string {
  try {
    // CSV conversion requires flat items or a list.
    const arr = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
    return json2csv(arr, {
      emptyFieldValue: "",
      expandArrayObjects: true,
    });
  } catch (err: any) {
    return `CSV Conversion Error: ${err.message}`;
  }
}

// --- Cryptography Helpers (Client-side Web Crypto API) ---

// Helper: Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Base64URL encoding (RFC 4648)
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Helper: Base64URL decoding
export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Zero-knowledge Encryption: returns ciphertext (Base64), iv (Base64), and key (Base64URL)
export async function encryptJSON(jsonStr: string): Promise<{ ciphertext: string; iv: string; keyStr: string }> {
  // 1. Generate AES-GCM 256-bit key
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Export raw key and convert to base64url
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  const keyStr = base64UrlEncode(new Uint8Array(rawKey));

  // 3. Generate 12-byte initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 4. Encrypt payload
  const encoded = new TextEncoder().encode(jsonStr);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // 5. Convert outputs
  const ciphertext = arrayBufferToBase64(ciphertextBuffer);
  const ivStr = arrayBufferToBase64(iv.buffer);

  return { ciphertext, iv: ivStr, keyStr };
}

// Zero-knowledge Decryption: decrypts ciphertext with IV and raw Key Base64URL
export async function decryptJSON(ciphertextBase64: string, ivBase64: string, keyBase64Url: string): Promise<string> {
  const rawKey = base64UrlDecode(keyBase64Url);
  const iv = base64ToArrayBuffer(ivBase64);
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  // 1. Import raw AES-GCM key
  const key = await window.crypto.subtle.importKey(
    "raw",
    rawKey as any,
    "AES-GCM",
    true,
    ["decrypt"]
  );

  // 2. Decrypt payload
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Escape JSON String
export function escapeJSONString(raw: string): string {
  return JSON.stringify(raw);
}

// Unescape JSON String
export function unescapeJSONString(escaped: string): string {
  try {
    let formatted = escaped.trim();
    if (!formatted.startsWith('"')) {
      formatted = `"${formatted}`;
    }
    if (!formatted.endsWith('"')) {
      formatted = `${formatted}"`;
    }
    return JSON.parse(formatted);
  } catch (err) {
    return escaped
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
  }
}

// JWT / Base64 Decoder
export interface DecodedTokenResult {
  header: any | null;
  payload: any | null;
  rawPayload?: string;
  error?: string;
  isJWT: boolean;
}

export function decodeJWTOrBase64(input: string): DecodedTokenResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { header: null, payload: null, isJWT: false, error: "Empty input" };
  }

  // 1. JWT parsing
  const parts = trimmed.split(".");
  if (parts.length === 3) {
    try {
      const headerDecoded = window.atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
      const payloadDecoded = window.atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      return {
        header: JSON.parse(headerDecoded),
        payload: JSON.parse(payloadDecoded),
        isJWT: true,
      };
    } catch (err) {
      // Fall through to Base64 decode
    }
  }

  // 2. Base64 fallback
  try {
    const cleanedBase64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const decodedStr = window.atob(cleanedBase64);
    try {
      const parsed = JSON.parse(decodedStr);
      return {
        header: null,
        payload: parsed,
        isJWT: false,
      };
    } catch {
      return {
        header: null,
        payload: null,
        rawPayload: decodedStr,
        isJWT: false,
      };
    }
  } catch (err: any) {
    return {
      header: null,
      payload: null,
      isJWT: false,
      error: `Failed to decode: ${err.message}. Make sure the input is a valid JWT or Base64 string.`,
    };
  }
}

export function getLineColFromOffset(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;

  const limit = Math.min(Math.max(0, offset), text.length);

  for (let i = 0; i < limit; i++) {
    const char = text[i];
    if (char === "\n") {
      line++;
      column = 1;
    } else if (char !== "\r") {
      column++;
    }
  }

  return { line, column };
}

export interface ParsedJSONError {
  message: string;
  line?: number;
  column?: number;
}

export function parseJSONError(err: any, rawText: string): ParsedJSONError {
  const errMsg = err?.message || String(err || "Unknown error");

  // 1. Check direct error properties (e.g. from Firefox, Safari, or custom error structures)
  let line = err?.line ?? err?.lineNumber;
  let column = err?.column ?? err?.columnNumber ?? err?.columnNo;

  if (typeof line === "number" && typeof column === "number") {
    return { message: errMsg, line, column };
  }
  if (typeof line === "number") {
    return { message: errMsg, line, column: column ?? 1 };
  }

  // 2. Pre-clean and match V8's parenthesized line/column format if present
  // Example: "Expected ',' or '}' after property value in JSON at position 123 (line 3 column 5)"
  const v8LineColRegex = /\s*\(line\s+(\d+)\s+column\s+(\d+)\)/i;
  const matchV8LineCol = errMsg.match(v8LineColRegex);
  if (matchV8LineCol) {
    const cleanMsg = errMsg.replace(v8LineColRegex, "");
    return {
      message: cleanMsg,
      line: parseInt(matchV8LineCol[1], 10),
      column: parseInt(matchV8LineCol[2], 10),
    };
  }

  // 3. Check for "line X column Y" format (Firefox/Safari/Node)
  const lineColRegex = /line\s+(\d+)\s+column\s+(\d+)/i;
  const matchLineCol = errMsg.match(lineColRegex);
  if (matchLineCol) {
    return {
      message: errMsg,
      line: parseInt(matchLineCol[1], 10),
      column: parseInt(matchLineCol[2], 10),
    };
  }

  // 4. Check for "line X, column Y" format
  const lineColCommaRegex = /line\s+(\d+),\s+column\s+(\d+)/i;
  const matchLineColComma = errMsg.match(lineColCommaRegex);
  if (matchLineColComma) {
    return {
      message: errMsg,
      line: parseInt(matchLineColComma[1], 10),
      column: parseInt(matchLineColComma[2], 10),
    };
  }

  // 5. Check for position offset "at position X" (V8/Chrome/Edge)
  const positionRegex = /at position\s+(\d+)/i;
  const matchPosition = errMsg.match(positionRegex);
  if (matchPosition) {
    const offset = parseInt(matchPosition[1], 10);
    const pos = getLineColFromOffset(rawText, offset);

    // Clean up the error message by removing redundant (line X column Y) parens if present
    const cleanMsg = errMsg.replace(/\s*\(line\s+\d+\s+column\s+\d+\)/i, "");

    return {
      message: cleanMsg,
      line: pos.line,
      column: pos.column,
    };
  }

  // 6. Fallback for "unexpected end of" errors
  if (/unexpected end of/i.test(errMsg)) {
    const pos = getLineColFromOffset(rawText, rawText.length);
    return {
      message: errMsg,
      line: pos.line,
      column: pos.column,
    };
  }

  return { message: errMsg };
}

