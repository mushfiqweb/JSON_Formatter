import { describe, it, expect } from "vitest";
import { generateJSONSchema, generateJSONSchemaString } from "./schemaGenerator";

describe("schemaGenerator", () => {
  describe("generateJSONSchema", () => {
    it("should handle null values", () => {
      const schema = generateJSONSchema(null);
      expect(schema).toEqual({ type: "null" });
    });

    it("should handle boolean values", () => {
      const schemaTrue = generateJSONSchema(true);
      expect(schemaTrue).toEqual({ type: "boolean" });

      const schemaFalse = generateJSONSchema(false);
      expect(schemaFalse).toEqual({ type: "boolean" });
    });

    it("should handle string values", () => {
      const schema = generateJSONSchema("hello");
      expect(schema).toEqual({ type: "string" });
    });

    it("should distinguish integer and float numbers", () => {
      const schemaInt = generateJSONSchema(42);
      expect(schemaInt).toEqual({ type: "integer" });

      const schemaFloat = generateJSONSchema(3.14159);
      expect(schemaFloat).toEqual({ type: "number" });
    });

    it("should generate schemas for arrays with uniform item types", () => {
      const schema = generateJSONSchema([1, 2, 3]);
      expect(schema).toEqual({
        type: "array",
        items: { type: "integer" },
      });
    });

    it("should generate schemas for arrays with mixed item types using anyOf", () => {
      const schema = generateJSONSchema([1, "two", null]);
      expect(schema).toEqual({
        type: "array",
        items: {
          anyOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
        },
      });
    });

    it("should generate empty array schema for empty arrays", () => {
      const schema = generateJSONSchema([]);
      expect(schema).toEqual({ type: "array" });
    });

    it("should generate schemas for nested objects with required properties list", () => {
      const obj = {
        name: "test",
        value: 12.3,
        nested: {
          active: true,
        },
      };
      const schema = generateJSONSchema(obj);
      expect(schema).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
          nested: {
            type: "object",
            properties: {
              active: { type: "boolean" },
            },
            required: ["active"],
          },
        },
        required: ["name", "value", "nested"],
      });
    });
  });

  describe("generateJSONSchemaString", () => {
    it("should wrap the schema with Draft-07 metadata and output formatted JSON", () => {
      const val = { key: "value" };
      const schemaStr = generateJSONSchemaString(val);
      const parsed = JSON.parse(schemaStr);

      expect(parsed.$schema).toBe("http://json-schema.org/draft-07/schema#");
      expect(parsed.title).toBe("GeneratedSchema");
      expect(parsed.type).toBe("object");
      expect(parsed.properties.key).toEqual({ type: "string" });
      expect(parsed.required).toContain("key");
    });
  });
});
