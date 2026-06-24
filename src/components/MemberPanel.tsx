import { useState } from "react";
import type { Member } from "../types";
import { useToast } from "../hooks/useToast";
import Avatar from "./Avatar";
import { XIcon, PlusIcon, LinkIcon } from "./Icons";

interface MemberPanelProps {
  members: Member[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onUpdateMember?: (id: string, updates: Partial<Member>) => void;
}

export default function MemberPanel({ members, onAdd, onRemove, onUpdateMember }: MemberPanelProps) {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentHandle, setPaymentHandle] = useState("");
  const [paymentApp, setPaymentApp] = useState<"venmo" | "paypal" | "cashapp">("venmo");
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
    if (!window.confirm(`Remove "${m.name}" from this trip? Their expenses will remain in the ledger.`)) return;
    onRemove(m.id);
    addToast(`${m.name} removed`, "info");
  };

  const startEditing = (m: Member) => {
    setEditingId(m.id);
    setPaymentHandle(m.paymentHandle || "");
    setPaymentApp(m.paymentApp || "venmo");
  };

  const savePaymentInfo = () => {
    if (editingId && onUpdateMember) {
      onUpdateMember(editingId, { paymentHandle: paymentHandle.trim() || undefined, paymentApp });
      addToast("Payment info updated");
    }
    setEditingId(null);
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
              {m.paymentHandle && (
                <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}>
                  {m.paymentApp === "venmo" ? "V" : m.paymentApp === "paypal" ? "P" : "$"}
                </span>
              )}
              <button
                onClick={() => startEditing(m)}
                className="hover:text-primary transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full"
                style={{ color: "var(--text-muted)" }}
                aria-label={`Edit payment info for ${m.name}`}
              >
                <LinkIcon className="w-3 h-3" />
              </button>
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

        {editingId && (
          <div className="p-3 rounded-lg mb-2 animate-fadeIn" style={{ background: "var(--md-sys-color-surface-container)" }}>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              Payment info for {members.find((m) => m.id === editingId)?.name}
            </div>
            <div className="flex gap-2 mb-2">
              <select
                className="rounded-lg px-2 py-1.5 text-xs min-h-[32px]"
                value={paymentApp}
                onChange={(e) => setPaymentApp(e.target.value as "venmo" | "paypal" | "cashapp")}
              >
                <option value="venmo">Venmo</option>
                <option value="paypal">PayPal</option>
                <option value="cashapp">Cash App</option>
              </select>
              <input
                className="flex-1 rounded-lg px-2 py-1.5 text-xs min-h-[32px]"
                value={paymentHandle}
                onChange={(e) => setPaymentHandle(e.target.value)}
                placeholder={paymentApp === "venmo" ? "@username" : paymentApp === "paypal" ? "email" : "$cashtag"}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingId(null)} className="flex-1 text-xs py-1.5 rounded-lg" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}>
                Cancel
              </button>
              <button onClick={savePaymentInfo} className="flex-1 text-xs py-1.5 rounded-lg gradient-accent font-semibold">
                Save
              </button>
            </div>
          </div>
        )}

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
