import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "system");

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && mq.matches);
      root.classList.toggle("dark", isDark);
    };

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return { theme, setTheme };
}
