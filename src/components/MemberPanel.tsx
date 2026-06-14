import { useState } from "react";
import type { Member } from "../types";
import { useToast } from "../hooks/useToast";
import Avatar from "./Avatar";
import { XIcon, PlusIcon } from "./Icons";

interface MemberPanelProps {
  members: Member[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export default function MemberPanel({ members, onAdd, onRemove }: MemberPanelProps) {
  const [input, setInput] = useState("");
  const { addToast } = useToast();

  const handleAdd = () => {
    const name = input.trim();
    if (!name) {
      addToast("Member name cannot be empty", "error");
      return;
    }
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      addToast("Member already exists", "error");
      return;
    }
    onAdd(name);
    setInput("");
    addToast(`${name} added`);
  };

  const handleRemove = (m: Member) => {
    onRemove(m.id);
    addToast(`${m.name} removed`, "info");
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          {members.map((m, idx) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 text-sm pl-1.5 pr-1 py-1 rounded-full animate-fadeIn"
              style={{ background: "var(--border)", color: "var(--text-primary)", animationDelay: `${idx * 30}ms` }}
            >
              <Avatar name={m.name} size="sm" />
              <span className="pl-0.5">{m.name}</span>
              <button
                onClick={() => handleRemove(m)}
                className="hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                style={{ color: "var(--text-muted)" }}
                aria-label={`Remove ${m.name}`}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add member"
            aria-label="Member name"
          />
          <button
            onClick={handleAdd}
            className="text-sm px-4 py-2 rounded-lg transition-opacity btn-press min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
            style={{ background: "var(--border)", color: "var(--text-secondary)" }}
            aria-label="Add member"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
