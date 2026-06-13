import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { CheckIcon, XIcon, InfoIcon } from "../components/Icons";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
}

const ToastContext = createContext<{ addToast: (message: string, type?: Toast["type"], action?: () => void) => {
  id: string;
  startLongPress: () => void;
  endLongPress: () => void;
  handleClick: () => void;
} } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const longPressTimers = useRef<Map<string, number>>(new Map());

  const addToast = useCallback((message: string, type: Toast["type"] = "success", action?: () => void) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type, timestamp: Date.now() };
    setToasts((prev) => [...prev, toast]);

    const startLongPress = () => {
      if (longPressTimers.current.has(id)) return;
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.map((t) => 
          t.id === id ? { ...t, type: "info", message: `${t.message} (Press to keep)` } : t
        ));
        longPressTimers.current.delete(id);
      }, 3000);
      longPressTimers.current.set(id, timer);
    };

    const endLongPress = () => {
      const timer = longPressTimers.current.get(id);
      if (timer) {
        window.clearTimeout(timer);
        longPressTimers.current.delete(id);
      }
      if (action) {
        action();
      }
    };

    const handleClick = () => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      longPressTimers.current.delete(id);
    };

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      longPressTimers.current.delete(id);
    }, 3000);

    return { id, startLongPress, endLongPress, handleClick };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = longPressTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      longPressTimers.current.delete(id);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const colors = {
            success: "bg-emerald-600 dark:bg-emerald-500",
            error: "bg-red-600 dark:bg-red-500",
            info: "bg-indigo-600 dark:bg-indigo-500",
          };
          const icons = { success: <CheckIcon className="w-4 h-4" />, error: <XIcon className="w-4 h-4" />, info: <InfoIcon className="w-4 h-4" /> };
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-white text-sm font-medium ${colors[toast.type]} animate-slideInRight cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              {icons[toast.type]}
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return { addToast: ctx.addToast };
}
