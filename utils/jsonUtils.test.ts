import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "crypto";
import {
  computeJSONMetrics,
  repairAndFormatJSON,
  minifyJSON,
  convertJSONToXML,
  convertJSONToCSV,
  escapeJSONString,
  unescapeJSONString,
  decodeJWTOrBase64,
  encryptJSON,
  decryptJSON,
  getLineColFromOffset,
  parseJSONError,
} from "./jsonUtils";

beforeAll(() => {
  if (typeof global.window === "undefined") {
    global.window = {
      crypto: webcrypto,
      atob: (str: string) => Buffer.from(str, "base64").toString("binary"),
      btoa: (str: string) => Buffer.from(str, "binary").toString("base64"),
    } as any;
  } else {
    if (typeof global.window.crypto === "undefined") {
      global.window.crypto = webcrypto as any;
    }
    if (typeof global.window.atob === "undefined") {
      global.window.atob = (str: string) => Buffer.from(str, "base64").toString("binary");
    }
    if (typeof global.window.btoa === "undefined") {
      global.window.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
    }
  }
});

describe("jsonUtils", () => {
  describe("computeJSONMetrics", () => {
    it("should calculate correct metrics for a standard JSON", () => {
      const obj = {
        id: 1,
        name: "test",
        tags: ["a", "b"],
        meta: { active: true },
      };
      const metrics = computeJSONMetrics(obj, 100);
      expect(metrics.sizeBytes).toBe(100);
      expect(metrics.keyCount).toBe(5); // id, name, tags, meta, active
      expect(metrics.arrayCount).toBe(1);
      expect(metrics.nodeCount).toBe(8);
      expect(metrics.maxDepth).toBe(2);
    });
  });

  describe("repairAndFormatJSON", () => {
    it("should format valid JSON", () => {
      const { formatted, error, repaired } = repairAndFormatJSON('{"foo":"bar"}', 2);
      expect(formatted).toBe('{\n  "foo": "bar"\n}');
      expect(repaired).toBe(false);
      expect(error).toBeUndefined();
    });

    it("should repair malformed JSON", () => {
      const { formatted, error, repaired } = repairAndFormatJSON('{"foo":bar}', 2);
      expect(formatted).toBe('{\n  "foo": "bar"\n}');
      expect(repaired).toBe(true);
      expect(error).toContain("Syntax error automatically repaired");
    });
  });

  describe("minifyJSON", () => {
    it("should minify valid JSON", () => {
      const { minified, repaired } = minifyJSON('{\n  "foo": "bar"\n}');
      expect(minified).toBe('{"foo":"bar"}');
      expect(repaired).toBe(false);
    });
  });

  describe("convertJSONToXML", () => {
    it("should convert JSON to valid XML", () => {
      const obj = { foo: "bar" };
      const xml = convertJSONToXML(obj);
      expect(xml).toContain("<foo>bar</foo>");
    });
  });

  describe("convertJSONToCSV", () => {
    it("should convert arrays to CSV", () => {
      const obj = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ];
      const csv = convertJSONToCSV(obj);
      expect(csv).toContain("name,age");
      expect(csv).toContain("Alice,30");
      expect(csv).toContain("Bob,25");
    });
  });

  describe("escape/unescape", () => {
    it("should escape and unescape strings cleanly", () => {
      const original = '{"foo":"bar"}';
      const escaped = escapeJSONString(original);
      expect(escaped).toBe('"{\\"foo\\":\\"bar\\"}"');
      const unescaped = unescapeJSONString(escaped);
      expect(unescaped).toBe(original);
    });
  });

  describe("decodeJWTOrBase64", () => {
    it("should decode standard Base64 JSON payloads", () => {
      const payload = { user: "mushfiq" };
      const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
      const result = decodeJWTOrBase64(base64);
      expect(result.payload).toEqual(payload);
      expect(result.isJWT).toBe(false);
    });

    it("should decode JWT structures", () => {
      const header = { alg: "HS256", typ: "JWT" };
      const payload = { sub: "12345", name: "Mushfiq" };
      const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const jwt = `${headerB64}.${payloadB64}.signature`;
      const result = decodeJWTOrBase64(jwt);
      expect(result.header).toEqual(header);
      expect(result.payload).toEqual(payload);
      expect(result.isJWT).toBe(true);
    });
  });

  describe("encryption/decryption", () => {
    it("should encrypt and decrypt payloads successfully using AES-GCM Web Crypto", async () => {
      const secret = "Zero-Knowledge Secret Payload";
      const { ciphertext, iv, keyStr } = await encryptJSON(secret);
      expect(ciphertext).toBeDefined();
      expect(iv).toBeDefined();
      expect(keyStr).toBeDefined();

      const decrypted = await decryptJSON(ciphertext, iv, keyStr);
      expect(decrypted).toBe(secret);
    });
  });

  describe("getLineColFromOffset", () => {
    it("should calculate correct line and column on Unix line endings", () => {
      const text = '{\n  "name": "John",\n  "age": 30\n}';
      // offset = 0 -> '{'
      expect(getLineColFromOffset(text, 0)).toEqual({ line: 1, column: 1 });
      // offset = 1 -> '\n'
      expect(getLineColFromOffset(text, 1)).toEqual({ line: 1, column: 2 });
      // offset = 2 -> ' ' on line 2
      expect(getLineColFromOffset(text, 2)).toEqual({ line: 2, column: 1 });
      // offset = 4 -> '"' on line 2
      expect(getLineColFromOffset(text, 4)).toEqual({ line: 2, column: 3 });
    });

    it("should calculate correct line and column on Windows line endings", () => {
      const text = '{\r\n  "name": "John"\r\n}';
      // offset = 0 -> '{'
      expect(getLineColFromOffset(text, 0)).toEqual({ line: 1, column: 1 });
      // offset = 1 -> '\r'
      expect(getLineColFromOffset(text, 1)).toEqual({ line: 1, column: 2 });
      // offset = 2 -> '\n'
      expect(getLineColFromOffset(text, 2)).toEqual({ line: 1, column: 2 });
      // offset = 3 -> ' ' on line 2
      expect(getLineColFromOffset(text, 3)).toEqual({ line: 2, column: 1 });
    });
  });

  describe("parseJSONError", () => {
    it("should parse standard V8 error position format", () => {
      const text = '{\n  "name": "John",\n  "age": 30,\n  badstring\n}';
      const errorMsg = "Unexpected token b in JSON at position 35";
      const err = new Error(errorMsg);
      const parsed = parseJSONError(err, text);
      expect(parsed.line).toBe(4);
      expect(parsed.column).toBe(3);
      expect(parsed.message).toBe(errorMsg);
    });

    it("should parse new V8 line/col inside parens format", () => {
      const text = '{\n  "name": "John"\n}';
      const errorMsg = "Expected ',' or '}' after property value in JSON at position 123 (line 3 column 5)";
      const err = new Error(errorMsg);
      const parsed = parseJSONError(err, text);
      expect(parsed.line).toBe(3);
      expect(parsed.column).toBe(5);
      expect(parsed.message).toBe("Expected ',' or '}' after property value in JSON at position 123");
    });

    it("should parse Firefox error line/column format", () => {
      const errorMsg = "JSON.parse: unexpected non-whitespace character after JSON data at line 9 column 5 of the JSON data";
      const err = new Error(errorMsg);
      const parsed = parseJSONError(err, "");
      expect(parsed.line).toBe(9);
      expect(parsed.column).toBe(5);
      expect(parsed.message).toBe(errorMsg);
    });

    it("should respect error properties if they exist", () => {
      const err = {
        message: "JSON Parse error: Expected '}'",
        lineNumber: 12,
        columnNumber: 4,
      };
      const parsed = parseJSONError(err, "");
      expect(parsed.line).toBe(12);
      expect(parsed.column).toBe(4);
    });

    it("should parse unexpected end of input format", () => {
      const text = '{\n  "name": "John"';
      const errorMsg = "Unexpected end of JSON input";
      const err = new Error(errorMsg);
      const parsed = parseJSONError(err, text);
      expect(parsed.line).toBe(2);
      expect(parsed.column).toBe(17);
    });
  });
});
