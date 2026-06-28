import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useJSONStore } from "./store";

describe("JSON Store", () => {
  let setItemSpy: any;
  let removeItemSpy: any;
  let mockStorage: any;

  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  it("should persist normal-sized input to localStorage and clear warnings after debounce", () => {
    const input = '{"foo": "bar"}';
    useJSONStore.getState().setRawInput(input);
    expect(useJSONStore.getState().rawInput).toBe(input);
    expect(useJSONStore.getState().systemWarning).toBeNull();
    
    // Check that it's debounced (not called synchronously)
    expect(setItemSpy).not.toHaveBeenCalled();
    
    vi.runAllTimers();
    
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_raw_input", input);
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it("should bypass localStorage for inputs exceeding 1.5MB and set warning", () => {
    const largeInput = "A".repeat(1500001);
    useJSONStore.getState().setRawInput(largeInput);
    expect(useJSONStore.getState().rawInput).toBe(largeInput);
    expect(useJSONStore.getState().systemWarning).toContain("Payload > 1.5MB");
    
    vi.runAllTimers();
    
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith("json_formatter_raw_input");
  });

  it("should handle QuotaExceededError, clean up, and set warning after debounce", () => {
    setItemSpy.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const input = '{"foo": "bar"}';
    useJSONStore.getState().setRawInput(input);
    expect(useJSONStore.getState().rawInput).toBe(input);
    
    // Not set/warned synchronously
    expect(useJSONStore.getState().systemWarning).toBeNull();
    
    vi.runAllTimers();
    
    expect(useJSONStore.getState().systemWarning).toContain("Storage Quota Exceeded");
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_raw_input", input);
    expect(removeItemSpy).toHaveBeenCalledWith("json_formatter_raw_input");
  });

  it("should update and persist editorFontSize to localStorage", () => {
    useJSONStore.getState().setEditorFontSize(18);
    expect(useJSONStore.getState().editorFontSize).toBe(18);
    expect(setItemSpy).toHaveBeenCalledWith("json_formatter_font_size", "18");
  });

  it("should add a toast and automatically dismiss it after duration", () => {
    useJSONStore.setState({ toasts: [] });

    useJSONStore.getState().showToast({
      type: "success",
      title: "Test Toast",
      description: "Testing toast behavior",
      duration: 3000,
    });

    const state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].title).toBe("Test Toast");
    expect(state.toasts[0].id).toBeDefined();

    vi.advanceTimersByTime(3000);
    expect(useJSONStore.getState().toasts).toHaveLength(0);
  });

  it("should dismiss a toast when calling dismissToast", () => {
    useJSONStore.setState({ toasts: [] });

    useJSONStore.getState().showToast({
      type: "info",
      title: "Dismiss Me",
      description: "This should be dismissed",
    });

    let state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(1);
    const toastId = state.toasts[0].id;

    useJSONStore.getState().dismissToast(toastId);
    expect(useJSONStore.getState().toasts).toHaveLength(0);
  });

  it("should trigger correct warnings and prevent toast spam when size category changes", () => {
    useJSONStore.setState({ toasts: [], lastSizeClass: 0 });

    // Category 1: > 1.5MB
    const input1 = "A".repeat(1600000);
    useJSONStore.getState().setRawInput(input1);
    let state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].title).toBe("Memory Mode Activated");
    expect(state.lastSizeClass).toBe(1);

    // Typing inside Category 1 should not trigger new toasts (no spam)
    const input1_updated = "A".repeat(1700000);
    useJSONStore.getState().setRawInput(input1_updated);
    state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(1);

    // Category 2: > 5MB
    const input2 = "A".repeat(5100000);
    useJSONStore.getState().setRawInput(input2);
    state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(2);
    expect(state.toasts[1].title).toBe("High Load Detected");
    expect(state.lastSizeClass).toBe(2);

    // Category 3: > 10MB
    const input3 = "A".repeat(10100000);
    useJSONStore.getState().setRawInput(input3);
    state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(3);
    expect(state.toasts[2].title).toBe("Heavy Memory Load Warning");
    expect(state.lastSizeClass).toBe(3);

    // Category 4: > 50MB
    const input4 = "A".repeat(50100000);
    useJSONStore.getState().setRawInput(input4);
    state = useJSONStore.getState();
    expect(state.toasts).toHaveLength(4);
    expect(state.toasts[3].title).toBe("Extreme Payload Risk");
    expect(state.lastSizeClass).toBe(4);
  });
});
