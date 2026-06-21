import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns fallback when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value from localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("updates value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    act(() => {
      result.current[1]("new-value");
    });
    expect(result.current[0]).toBe("new-value");
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useLocalStorage<number>("counter", 0));
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
  });

  it("handles JSON parse errors gracefully", () => {
    localStorage.setItem("test-key", "not-json");
    const { result } = renderHook(() => useLocalStorage("test-key", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("debounces localStorage write", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    act(() => {
      result.current[1]("updated");
    });
    // Value is updated in state immediately
    expect(result.current[0]).toBe("updated");
    // But localStorage is not yet written (debounced)
    expect(localStorage.getItem("test-key")).toBeNull();
    // Fast forward 300ms
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("updated"));
    vi.useRealTimers();
  });
});
