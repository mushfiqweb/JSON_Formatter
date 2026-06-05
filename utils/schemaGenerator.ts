// Client-side recursive JSON Schema generator mapping JSON elements to draft-07 standards

export function generateJSONSchema(val: any): any {
  if (val === null) {
    return { type: "null" };
  }
  if (Array.isArray(val)) {
    const schema: Record<string, any> = { type: "array" };
    if (val.length > 0) {
      const uniqueSchemas = val.map((item) => generateJSONSchema(item));
      const uniqueSchemasStr = Array.from(new Set(uniqueSchemas.map((s) => JSON.stringify(s))));
      const deduped = uniqueSchemasStr.map((s) => JSON.parse(s));

      if (deduped.length === 1) {
        schema.items = deduped[0];
      } else if (deduped.length > 1) {
        schema.items = { anyOf: deduped };
      }
    }
    return schema;
  }
  if (typeof val === "object") {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const key in val) {
      properties[key] = generateJSONSchema(val[key]);
      required.push(key);
    }
    return {
      type: "object",
      properties,
      required,
    };
  }
  if (typeof val === "number") {
    return { type: Number.isInteger(val) ? "integer" : "number" };
  }
  if (typeof val === "boolean") {
    return { type: "boolean" };
  }
  return { type: "string" };
}

export function generateJSONSchemaString(val: any): string {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "GeneratedSchema",
    ...generateJSONSchema(val),
  };
  return JSON.stringify(schema, null, 2);
}
