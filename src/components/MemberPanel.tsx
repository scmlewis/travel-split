import { useState } from "react";
import type { Member } from "../types";
import { useToast } from "../hooks/useToast";
import Avatar from "./Avatar";

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
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm pl-1.5 pr-1 py-1 rounded-full border border-slate-200 dark:border-slate-600 animate-fadeIn"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <Avatar name={m.name} size="sm" />
              <span className="pl-0.5">{m.name}</span>
              <button
                onClick={() => handleRemove(m)}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-base"
                aria-label={`Remove ${m.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add member"
            aria-label="Member name"
          />
          <button
            onClick={handleAdd}
            className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors btn-press min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
            aria-label="Add member"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
