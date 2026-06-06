import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useJSONStore } from "./store";

describe("JSON Store", () => {
  let setItemSpy: any;
  let removeItemSpy: any;
  let mockStorage: any;

  beforeEach(() => {
    // Reset Zustand store
    useJSONStore.setState({ rawInput: "" });
    
    mockStorage = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    (globalThis as any).window = {};
    (globalThis as any).localStorage = mockStorage;

    setItemSpy = mockStorage.setItem;
    removeItemSpy = mockStorage.removeItem;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should persist normal-sized input to localStorage and clear warnings", () => {
    const input = '{"foo": "bar"}';
    useJSONStore.getState().setRawInput(input);
    expect(useJSONStore.getState().rawInput).toBe(input);
    expect(useJSONStore.getState().systemWarning).toBeNull();
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_raw_input", input);
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it("should bypass localStorage for inputs exceeding 1.5MB and set warning", () => {
    const largeInput = "A".repeat(1500001);
    useJSONStore.getState().setRawInput(largeInput);
    expect(useJSONStore.getState().rawInput).toBe(largeInput);
    expect(useJSONStore.getState().systemWarning).toContain("Payload > 1.5MB");
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith("json_formatter_raw_input");
  });

  it("should handle QuotaExceededError, clean up, and set warning", () => {
    setItemSpy.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const input = '{"foo": "bar"}';
    useJSONStore.getState().setRawInput(input);
    expect(useJSONStore.getState().rawInput).toBe(input);
    expect(useJSONStore.getState().systemWarning).toContain("Storage Quota Exceeded");
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_raw_input", input);
    expect(removeItemSpy).toHaveBeenCalledWith("json_formatter_raw_input");
  });

  it("should update and persist editorFontSize to localStorage", () => {
    useJSONStore.getState().setEditorFontSize(18);
    expect(useJSONStore.getState().editorFontSize).toBe(18);
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_font_size", "18");
  });
});
