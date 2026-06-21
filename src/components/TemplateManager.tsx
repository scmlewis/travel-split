import { useState } from "react";
import type { ExpenseTemplate, CurrencyCode } from "../types";
import { CURRENCY_MAP, generateId } from "../types";
import { PlusIcon, XIcon, TrashIcon } from "./Icons";

interface TemplateManagerProps {
  templates: ExpenseTemplate[];
  onUpdate: (templates: ExpenseTemplate[]) => void;
  onApply: (template: ExpenseTemplate) => void;
  baseCurrency: CurrencyCode;
  memberCount: number;
}

export default function TemplateManager({ templates, onUpdate, onApply, baseCurrency, memberCount }: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedTitle = title.trim();
    if (!trimmedName) return;
    if (!trimmedTitle) return;
    if (memberCount === 0) return;

    const template: ExpenseTemplate = {
      id: generateId(),
      name: trimmedName,
      title: trimmedTitle,
      totalAmount: parseFloat(amount) || 0,
      currency: baseCurrency,
      splitType: "equal",
    };
    onUpdate([...templates, template]);
    setName("");
    setTitle("");
    setAmount("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(templates.filter((t) => t.id !== id));
  };

  return (
    <div>
      {templates.length === 0 && !showForm ? (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>No templates saved</span>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all min-h-[28px] flex items-center gap-1"
            style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--accent)" }}
            aria-label="Save new template"
          >
            <PlusIcon className="w-3 h-3" /> Save Current
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all min-h-[28px] flex items-center gap-1"
            style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--accent)" }}
            aria-label={showForm ? "Close template form" : "Save new template"}
          >
            {showForm ? <XIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
            {showForm ? "Cancel" : "Save Current"}
          </button>
        </div>
      )}

      {showForm && (
        <div className="space-y-2 mb-2 p-3 rounded-lg" style={{ background: "var(--surface-elevated)" }}>
          <input
            className="w-full rounded-lg px-3 py-2 text-sm min-h-[36px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (e.g. 'Weekly Dinner')"
            aria-label="Template name"
          />
          <input
            className="w-full rounded-lg px-3 py-2 text-sm min-h-[36px]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Expense title"
            aria-label="Default expense title"
          />
          <input
            className="w-full rounded-lg px-3 py-2 text-sm min-h-[36px] font-mono"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Default amount"
            aria-label="Default amount"
          />
          <button
            onClick={handleSave}
            className="w-full gradient-accent text-white text-sm py-2 rounded-lg font-semibold btn-press min-h-[36px]"
            disabled={!name.trim() || !title.trim()}
          >
            Save Template
          </button>
        </div>
      )}

      {templates.length > 0 && (
        <div className="space-y-1.5">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-opacity hover:opacity-80" style={{ background: "var(--surface-elevated)" }}>
              <button
                onClick={() => onApply(t)}
                className="flex-1 text-left min-w-0"
                aria-label={`Apply template ${t.name}`}
              >
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                  {t.title} · {CURRENCY_MAP[t.currency]?.symbol ?? ""}{t.totalAmount > 0 ? t.totalAmount.toFixed(2) : "—"}
                </div>
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 rounded-lg transition-opacity btn-press shrink-0"
                style={{ color: "var(--text-muted)" }}
                aria-label={`Delete template ${t.name}`}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
