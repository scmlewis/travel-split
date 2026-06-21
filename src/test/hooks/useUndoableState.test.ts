import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useUndoableState } from "../../hooks/useUndoableState";

describe("useUndoableState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial fallback value", () => {
    const { result } = renderHook(() => useUndoableState("test-key", "initial"));
    expect(result.current.state).toBe("initial");
  });

  it("restores value from localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useUndoableState("test-key", "initial"));
    expect(result.current.state).toBe("stored");
  });

  it("updates state", () => {
    const { result } = renderHook(() => useUndoableState("test-key", "initial"));
    act(() => {
      result.current.setState("new");
    });
    expect(result.current.state).toBe("new");
  });

  it("can undo after state change", async () => {
    const { result } = renderHook(() => useUndoableState("test-key", "initial"));
    act(() => {
      result.current.setState("changed");
    });
    await waitFor(() => expect(result.current.canUndo).toBe(true));
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe("initial");
    await waitFor(() => expect(result.current.canUndo).toBe(false));
  });

  it("can redo after undo", async () => {
    const { result } = renderHook(() => useUndoableState("test-key", "initial"));
    act(() => {
      result.current.setState("changed");
    });
    act(() => {
      result.current.undo();
    });
    await waitFor(() => expect(result.current.canRedo).toBe(true));
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe("changed");
    await waitFor(() => expect(result.current.canRedo).toBe(false));
  });

  it("clears future on new state after undo", async () => {
    const { result } = renderHook(() => useUndoableState("test-key", "a"));
    act(() => { result.current.setState("b"); });
    act(() => { result.current.setState("c"); });
    act(() => { result.current.undo(); });
    await waitFor(() => expect(result.current.canRedo).toBe(true));
    act(() => { result.current.setState("d"); });
    await waitFor(() => expect(result.current.canRedo).toBe(false));
  });

  it("clearHistory resets undo/redo state", async () => {
    const { result } = renderHook(() => useUndoableState("test-key", "a"));
    act(() => { result.current.setState("b"); });
    await waitFor(() => expect(result.current.canUndo).toBe(true));
    act(() => { result.current.clearHistory(); });
    await waitFor(() => {
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useUndoableState<number>("test-key", 0));
    act(() => { result.current.setState((prev) => prev + 1); });
    expect(result.current.state).toBe(1);
    act(() => { result.current.setState((prev) => prev + 1); });
    expect(result.current.state).toBe(2);
    act(() => { result.current.undo(); });
    expect(result.current.state).toBe(1);
  });
});
