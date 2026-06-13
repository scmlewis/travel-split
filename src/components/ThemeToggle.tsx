import type { Theme } from "../hooks/useTheme";
import { SunIcon, MoonIcon, MonitorIcon } from "./Icons";

interface ThemeToggleProps {
  theme: Theme;
  onChange: (t: Theme) => void;
}

const CYCLE: Theme[] = ["light", "dark", "system"];
const ICONS: Record<Theme, React.ReactNode> = {
  light: <SunIcon className="w-4 h-4" />,
  dark: <MoonIcon className="w-4 h-4" />,
  system: <MonitorIcon className="w-4 h-4" />,
};
const LABELS: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const cycle = () => {
    const idx = CYCLE.indexOf(theme);
    onChange(CYCLE[(idx + 1) % CYCLE.length]);
  };

  return (
    <button
      onClick={cycle}
      className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap font-medium min-h-[44px] flex items-center gap-1.5"
      title={`Theme: ${LABELS[theme]}`}
    >
      {ICONS[theme]}
      {LABELS[theme]}
    </button>
  );
}
