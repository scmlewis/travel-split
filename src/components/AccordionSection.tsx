import { useState } from "react";
import { ChevronIcon } from "./Icons";

interface AccordionSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export default function AccordionSection({ title, icon, defaultOpen = false, badge, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left min-h-[48px] transition-opacity hover:opacity-80"
        aria-expanded={open}
        aria-label={`${title} section`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-sm font-semibold uppercase tracking-wider flex-1" style={{ color: "var(--text-secondary)" }}>
          {title}
        </span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono mr-1" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
            {badge}
          </span>
        )}
        <ChevronIcon
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
