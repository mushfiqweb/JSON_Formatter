// Type generators for translating JSON payloads into class and structural models client-side

function capitalize(str: string): string {
  if (!str) return "Item";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sanitizeName(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

// 1. TypeScript Interface Generator
export function jsonToTypeScript(val: any, rootName = "RootObject"): string {
  const interfaces: Record<string, string> = {};

  function getTypeName(name: string, value: any): string {
    if (value === null) return "any";
    if (Array.isArray(value)) {
      if (value.length === 0) return "any[]";
      const itemTypes = Array.from(new Set(value.map((item) => getTypeName(name + "Item", item))));
      return itemTypes.length === 1 ? `${itemTypes[0]}[]` : `(${itemTypes.join(" | ")})[]`;
    }
    if (typeof value === "object") {
      const interfaceName = capitalize(sanitizeName(name));
      buildInterface(interfaceName, value);
      return interfaceName;
    }
    return typeof value;
  }

  function buildInterface(name: string, obj: any) {
    if (interfaces[name]) return;
    interfaces[name] = ""; // Prevent infinite recursion

    let result = `export interface ${name} {\n`;
    for (const key in obj) {
      const typeStr = getTypeName(key, obj[key]);
      const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      result += `  ${validKey}: ${typeStr};\n`;
    }
    result += `}\n`;
    interfaces[name] = result;
  }

  getTypeName(rootName, val);

  const sortedKeys = Object.keys(interfaces);
  const rootKey = capitalize(sanitizeName(rootName));
  const otherKeys = sortedKeys.filter((k) => k !== rootKey);

  let output = "";
  if (interfaces[rootKey]) {
    output += interfaces[rootKey] + "\n";
  }
  for (const k of otherKeys) {
    output += interfaces[k] + "\n";
  }
  return output.trim();
}

// 2. Go Struct Generator
export function jsonToGo(val: any, rootName = "RootObject"): string {
  const structs: Record<string, string> = {};

  function getTypeName(name: string, value: any): string {
    if (value === null) return "interface{}";
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]interface{}";
      return `[]${getTypeName(name + "Item", value[0])}`;
    }
    if (typeof value === "object") {
      const structName = capitalize(sanitizeName(name));
      buildStruct(structName, value);
      return structName;
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? "int" : "float64";
    }
    if (typeof value === "boolean") return "bool";
    return "string";
  }

  function buildStruct(name: string, obj: any) {
    if (structs[name]) return;
    structs[name] = "";

    let result = `type ${name} struct {\n`;
    for (const key in obj) {
      const fieldName = capitalize(sanitizeName(key));
      const typeStr = getTypeName(key, obj[key]);
      result += `\t${fieldName} ${typeStr} \`json:"${key}"\`\n`;
    }
    result += `}\n`;
    structs[name] = result;
  }

  getTypeName(rootName, val);

  const sortedKeys = Object.keys(structs);
  const rootKey = capitalize(sanitizeName(rootName));
  const otherKeys = sortedKeys.filter((k) => k !== rootKey);

  let output = "";
  if (structs[rootKey]) {
    output += structs[rootKey] + "\n";
  }
  for (const k of otherKeys) {
    output += structs[k] + "\n";
  }
  return output.trim();
}

// 3. Rust Struct Generator
export function jsonToRust(val: any, rootName = "RootObject"): string {
  const structs: Record<string, string> = {};

  function getTypeName(name: string, value: any): string {
    if (value === null) return "serde_json::Value";
    if (Array.isArray(value)) {
      if (value.length === 0) return "Vec<serde_json::Value>";
      return `Vec<${getTypeName(name + "Item", value[0])}>`;
    }
    if (typeof value === "object") {
      const structName = capitalize(sanitizeName(name));
      buildStruct(structName, value);
      return structName;
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? "i64" : "f64";
    }
    if (typeof value === "boolean") return "bool";
    return "String";
  }

  function buildStruct(name: string, obj: any) {
    if (structs[name]) return;
    structs[name] = "";

    let result = `#[derive(Serialize, Deserialize)]\n`;
    result += `pub struct ${name} {\n`;
    for (const key in obj) {
      const fieldName = sanitizeRustFieldName(key);
      const typeStr = getTypeName(key, obj[key]);

      if (fieldName !== key) {
        result += `    #[serde(rename = "${key}")]\n`;
      }
      result += `    pub ${fieldName}: ${typeStr},\n`;
    }
    result += `}\n`;
    structs[name] = result;
  }

  function sanitizeRustFieldName(str: string): string {
    let name = str.replace(/-/g, "_").replace(/([A-Z])/g, "_$1").toLowerCase();
    name = name.replace(/[^a-zA-Z0-9_]/g, "");
    name = name.replace(/__+/g, "_");
    if (name.startsWith("_")) name = name.substring(1);

    const keywords = ["type", "struct", "fn", "let", "match", "use", "pub", "impl", "mod", "as", "ref"];
    if (keywords.includes(name)) {
      name = `r#${name}`;
    }
    return name || "field";
  }

  getTypeName(rootName, val);

  const sortedKeys = Object.keys(structs);
  const rootKey = capitalize(sanitizeName(rootName));
  const otherKeys = sortedKeys.filter((k) => k !== rootKey);

  let output = "use serde::{Serialize, Deserialize};\n\n";
  if (structs[rootKey]) {
    output += structs[rootKey] + "\n";
  }
  for (const k of otherKeys) {
    output += structs[k] + "\n";
  }
  return output.trim();
}

// 4. Python Pydantic Model Generator
export function jsonToPython(val: any, rootName = "RootObject"): string {
  const classes: Record<string, string> = {};

  function getTypeName(name: string, value: any): string {
    if (value === null) return "Optional[Any]";
    if (Array.isArray(value)) {
      if (value.length === 0) return "List[Any]";
      return `List[${getTypeName(name + "Item", value[0])}]`;
    }
    if (typeof value === "object") {
      const className = capitalize(sanitizeName(name));
      buildClass(className, value);
      return className;
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? "int" : "float";
    }
    if (typeof value === "boolean") return "bool";
    return "str";
  }

  function buildClass(name: string, obj: any) {
    if (classes[name]) return;
    classes[name] = "";

    let result = `class ${name}(BaseModel):\n`;
    let hasFields = false;
    for (const key in obj) {
      const fieldName = sanitizePythonFieldName(key);
      const typeStr = getTypeName(key, obj[key]);
      result += `    ${fieldName}: ${typeStr}\n`;
      hasFields = true;
    }
    if (!hasFields) {
      result += `    pass\n`;
    }
    classes[name] = result;
  }

  function sanitizePythonFieldName(str: string): string {
    let name = str.replace(/-/g, "_").replace(/([A-Z])/g, "_$1").toLowerCase();
    name = name.replace(/[^a-zA-Z0-9_]/g, "");
    name = name.replace(/__+/g, "_");
    if (name.startsWith("_")) name = name.substring(1);
    const keywords = ["type", "class", "def", "import", "from", "as", "global", "lambda", "return", "pass"];
    if (keywords.includes(name)) {
      name = `${name}_`;
    }
    return name || "field";
  }

  getTypeName(rootName, val);

  const sortedKeys = Object.keys(classes);
  const rootKey = capitalize(sanitizeName(rootName));
  const otherKeys = sortedKeys.filter((k) => k !== rootKey);

  let output = "from typing import List, Any, Optional\nfrom pydantic import BaseModel\n\n\n";
  for (const k of otherKeys) {
    output += classes[k] + "\n\n";
  }
  if (classes[rootKey]) {
    output += classes[rootKey];
  }
  return output.trim();
}

// 5. Java Class Generator
export function jsonToJava(val: any, rootName = "RootObject"): string {
  const classes: Record<string, string> = {};

  function getTypeName(name: string, value: any): string {
    if (value === null) return "Object";
    if (Array.isArray(value)) {
      if (value.length === 0) return "List<Object>";
      return `List<${getTypeName(name + "Item", value[0])}>`;
    }
    if (typeof value === "object") {
      const className = capitalize(sanitizeName(name));
      buildClass(className, value);
      return className;
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? "Integer" : "Double";
    }
    if (typeof value === "boolean") return "Boolean";
    return "String";
  }

  function buildClass(name: string, obj: any) {
    if (classes[name]) return;
    classes[name] = "";

    let result = `public static class ${name} {\n`;
    for (const key in obj) {
      const fieldName = sanitizeJavaFieldName(key);
      const typeStr = getTypeName(key, obj[key]);
      result += `    @JsonProperty("${key}")\n`;
      result += `    private ${typeStr} ${fieldName};\n\n`;
    }

    for (const key in obj) {
      const fieldName = sanitizeJavaFieldName(key);
      const typeStr = getTypeName(key, obj[key]);
      const capitalizedField = capitalize(fieldName);

      result += `    public ${typeStr} get${capitalizedField}() {\n`;
      result += `        return this.${fieldName};\n`;
      result += `    }\n\n`;

      result += `    public void set${capitalizedField}(${typeStr} ${fieldName}) {\n`;
      result += `        this.${fieldName} = ${fieldName};\n`;
      result += `    }\n\n`;
    }

    result = result.trimEnd() + "\n}\n";
    classes[name] = result;
  }

  function sanitizeJavaFieldName(str: string): string {
    let name = str.replace(/[^a-zA-Z0-9_$]/g, "");
    if (/^[0-9]/.test(name)) name = "_" + name;
    const keywords = ["public", "private", "class", "interface", "void", "int", "double", "boolean", "float", "long", "short", "byte", "char"];
    if (keywords.includes(name)) {
      name = "_" + name;
    }
    return name || "field";
  }

  getTypeName(rootName, val);

  const sortedKeys = Object.keys(classes);
  const rootKey = capitalize(sanitizeName(rootName));
  const otherKeys = sortedKeys.filter((k) => k !== rootKey);

  let output = "import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n";

  if (otherKeys.length > 0) {
    output += `public class Wrapper {\n\n`;
    if (classes[rootKey]) {
      output += classes[rootKey].split("\n").map((l) => "    " + l).join("\n") + "\n\n";
    }
    for (const k of otherKeys) {
      output += classes[k].split("\n").map((l) => "    " + l).join("\n") + "\n\n";
    }
    output = output.trim() + "\n}";
  } else {
    if (classes[rootKey]) {
      output += classes[rootKey].replace("public static class", "public class");
    }
  }
  return output.trim();
}
