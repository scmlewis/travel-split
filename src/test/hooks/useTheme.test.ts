import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTheme } from "../../hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to dark theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("sets theme to light", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.theme).toBe("light");
  });

  it("sets theme to system", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("system");
    });
    expect(result.current.theme).toBe("system");
  });

  it("persists theme to localStorage", async () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("light");
    });
    // localStorage write is debounced (300ms)
    await waitFor(() => {
      const stored = localStorage.getItem("theme");
      expect(stored).toBeTruthy();
    });
    expect(JSON.parse(localStorage.getItem("theme")!)).toBe("light");
  });
});
