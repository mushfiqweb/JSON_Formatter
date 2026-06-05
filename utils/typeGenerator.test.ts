import { describe, it, expect } from "vitest";
import {
  jsonToTypeScript,
  jsonToGo,
  jsonToRust,
  jsonToPython,
  jsonToJava,
} from "./typeGenerator";

describe("typeGenerator", () => {
  const sampleObj = {
    id: 1,
    name: "John Doe",
    isActive: true,
    tags: ["admin", "user"],
    location: {
      city: "New York",
      zipCode: 10001,
    },
    scores: [95.5, 88.0],
  };

  describe("jsonToTypeScript", () => {
    it("should generate TypeScript interfaces for simple and nested structures", () => {
      const tsCode = jsonToTypeScript(sampleObj, "User");
      expect(tsCode).toContain("export interface User {");
      expect(tsCode).toContain("id: number;");
      expect(tsCode).toContain("name: string;");
      expect(tsCode).toContain("isActive: boolean;");
      expect(tsCode).toContain("tags: string[];");
      expect(tsCode).toContain("location: Location;");
      expect(tsCode).toContain("scores: number[];");
      expect(tsCode).toContain("export interface Location {");
      expect(tsCode).toContain("city: string;");
      expect(tsCode).toContain("zipCode: number;");
    });

    it("should handle empty values, null values and union types in arrays", () => {
      const edgeCaseObj = {
        emptyArray: [],
        nullValue: null,
        mixedArray: [1, "two", null],
      };
      const tsCode = jsonToTypeScript(edgeCaseObj, "EdgeCases");
      expect(tsCode).toContain("emptyArray: any[];");
      expect(tsCode).toContain("nullValue: any;");
      expect(tsCode).toContain("mixedArray: (number | string | any)[];");
    });
  });

  describe("jsonToGo", () => {
    it("should generate Go structs with appropriate json tags", () => {
      const goCode = jsonToGo(sampleObj, "User");
      expect(goCode).toContain("type User struct {");
      expect(goCode).toContain("Id int `json:\"id\"`");
      expect(goCode).toContain("Name string `json:\"name\"`");
      expect(goCode).toContain("IsActive bool `json:\"isActive\"`");
      expect(goCode).toContain("Tags []string `json:\"tags\"`");
      expect(goCode).toContain("Location Location `json:\"location\"`");
      expect(goCode).toContain("Scores []float64 `json:\"scores\"`");
      expect(goCode).toContain("type Location struct {");
      expect(goCode).toContain("City string `json:\"city\"`");
      expect(goCode).toContain("ZipCode int `json:\"zipCode\"`");
    });

    it("should handle empty/null fields in Go", () => {
      const edgeCaseObj = {
        emptyArray: [],
        nullValue: null,
      };
      const goCode = jsonToGo(edgeCaseObj, "EdgeCases");
      expect(goCode).toContain("EmptyArray []interface{} `json:\"emptyArray\"`");
      expect(goCode).toContain("NullValue interface{} `json:\"nullValue\"`");
    });
  });

  describe("jsonToRust", () => {
    it("should generate Rust structs with serde attributes", () => {
      const rustCode = jsonToRust(sampleObj, "User");
      expect(rustCode).toContain("use serde::{Serialize, Deserialize};");
      expect(rustCode).toContain("#[derive(Serialize, Deserialize)]");
      expect(rustCode).toContain("pub struct User {");
      expect(rustCode).toContain("pub id: i64,");
      expect(rustCode).toContain("pub name: String,");
      expect(rustCode).toContain("pub is_active: bool,");
      expect(rustCode).toContain("pub tags: Vec<String>,");
      expect(rustCode).toContain("pub location: Location,");
      expect(rustCode).toContain("pub scores: Vec<f64>,");
      expect(rustCode).toContain("pub struct Location {");
      expect(rustCode).toContain("pub city: String,");
      expect(rustCode).toContain("pub zip_code: i64,");
    });

    it("should escape keywords and handle serialization renaming for non-snake-case properties", () => {
      const edgeCaseObj = {
        type: "admin",
        "some-hyphenated-key": 123,
      };
      const rustCode = jsonToRust(edgeCaseObj, "Config");
      expect(rustCode).toContain("#[serde(rename = \"type\")]");
      expect(rustCode).toContain("pub r#type: String,");
      expect(rustCode).toContain("#[serde(rename = \"some-hyphenated-key\")]");
      expect(rustCode).toContain("pub some_hyphenated_key: i64,");
    });
  });

  describe("jsonToPython", () => {
    it("should generate Python Pydantic models with correct annotations", () => {
      const pyCode = jsonToPython(sampleObj, "User");
      expect(pyCode).toContain("from typing import List, Any, Optional");
      expect(pyCode).toContain("from pydantic import BaseModel");
      expect(pyCode).toContain("class Location(BaseModel):");
      expect(pyCode).toContain("city: str");
      expect(pyCode).toContain("zip_code: int");
      expect(pyCode).toContain("class User(BaseModel):");
      expect(pyCode).toContain("id: int");
      expect(pyCode).toContain("name: str");
      expect(pyCode).toContain("is_active: bool");
      expect(pyCode).toContain("tags: List[str]");
      expect(pyCode).toContain("location: Location");
      expect(pyCode).toContain("scores: List[float]");
    });

    it("should handle Python keywords and null annotations", () => {
      const edgeCaseObj = {
        class: "maths",
        noneVal: null,
      };
      const pyCode = jsonToPython(edgeCaseObj, "School");
      expect(pyCode).toContain("class_: str");
      expect(pyCode).toContain("none_val: Optional[Any]");
    });
  });

  describe("jsonToJava", () => {
    it("should generate static inner classes within a parent wrapper class for nested models", () => {
      const javaCode = jsonToJava(sampleObj, "User");
      expect(javaCode).toContain("import com.fasterxml.jackson.annotation.JsonProperty;");
      expect(javaCode).toContain("import java.util.List;");
      expect(javaCode).toContain("public class Wrapper {");
      expect(javaCode).toContain("public static class User {");
      expect(javaCode).toContain("@JsonProperty(\"id\")");
      expect(javaCode).toContain("private Integer id;");
      expect(javaCode).toContain("public Integer getId() {");
      expect(javaCode).toContain("public void setId(Integer id) {");
      expect(javaCode).toContain("public static class Location {");
      expect(javaCode).toContain("private String city;");
      expect(javaCode).toContain("private Integer zipCode;");
    });

    it("should handle Java keywords and generate a single class if flat model", () => {
      const flatObj = {
        private: true,
        count: 5,
      };
      const javaCode = jsonToJava(flatObj, "FlatClass");
      expect(javaCode).not.toContain("public class Wrapper {");
      expect(javaCode).toContain("public class FlatClass {");
      expect(javaCode).toContain("private Boolean _private;");
      expect(javaCode).toContain("private Integer count;");
    });
  });
});
