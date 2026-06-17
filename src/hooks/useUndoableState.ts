import { useState, useCallback, useRef, useEffect } from "react";

const MAX_HISTORY = 50;

export function useUndoableState<T>(key: string, fallback: T) {
  const [present, setPresent] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Debounced localStorage write (only present state)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(present));
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [key, present]);

  const updateFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const setState = useCallback((next: T | ((prev: T) => T)) => {
    setPresent((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev];
      futureRef.current = [];
      return resolved;
    });
    // Update flags after state change (will run after render via microtask)
    queueMicrotask(updateFlags);
  }, [updateFlags]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [present, ...futureRef.current];
    setPresent(prev);
    queueMicrotask(updateFlags);
  }, [present, updateFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, present];
    setPresent(next);
    queueMicrotask(updateFlags);
  }, [present, updateFlags]);

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { state: present, setState, undo, redo, canUndo, canRedo, clearHistory } as const;
}
