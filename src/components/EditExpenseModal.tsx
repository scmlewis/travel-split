import { useState } from "react";
import type { Expense, Member, CurrencyCode, SplitType } from "../types";
import type { ExpenseShare } from "../types";
import { CURRENCY_MAP, getCategoryLabel } from "../types";
import { useToast } from "../hooks/useToast";
import { XIcon, CheckIcon } from "./Icons";

interface EditExpenseModalProps {
  expense: Expense;
  members: Member[];
  baseSymbol: string;
  allCategories: string[];
  onSave: (updated: Expense) => void;
  onClose: () => void;
}

export default function EditExpenseModal({ expense, members, baseSymbol, allCategories, onSave, onClose }: EditExpenseModalProps) {
  const { addToast } = useToast();
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.totalAmount));
  const [currency, setCurrency] = useState<CurrencyCode>(expense.currency);
  const [rate, setRate] = useState(String(expense.exchangeRate));
  const [payerId, setPayerId] = useState(expense.payerId);
  const [date, setDate] = useState(expense.date);
  const [categories, setCategories] = useState<string[]>(expense.categories || []);
  const [notes, setNotes] = useState(expense.notes || "");
  const [splitType, setSplitType] = useState<SplitType>(expense.shares[0]?.splitType || "equal");
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of expense.shares) map[s.memberId] = String(s.amount);
    return map;
  });
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of expense.shares) map[s.memberId] = String(s.splitValue ?? 0);
    return map;
  });
  const [shareCount, setShareCount] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of expense.shares) map[s.memberId] = "1";
    return map;
  });

  const toggleCategory = (cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const numAmount = parseFloat(amount) || 0;

  const handleSave = () => {
    if (!title.trim()) { addToast("Title is required", "error"); return; }
    if (isNaN(numAmount) || numAmount <= 0) { addToast("Invalid amount", "error"); return; }
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) { addToast("Invalid exchange rate", "error"); return; }
    if (!date) { addToast("Date is required", "error"); return; }

    let shares: ExpenseShare[];
    if (splitType === "equal") {
      const per = numAmount / members.length;
      shares = members.map((m) => ({ memberId: m.id, amount: per, splitType: "equal" }));
    } else if (splitType === "exact") {
      const sum = members.reduce((s, m) => s + parseFloat(exactAmounts[m.id] || "0"), 0);
      if (Math.abs(sum - numAmount) > 0.01) { addToast(`Amounts total ${sum.toFixed(2)}, must equal ${numAmount.toFixed(2)}`, "error"); return; }
      shares = members.map((m) => ({ memberId: m.id, amount: parseFloat(exactAmounts[m.id] || "0"), splitType: "exact" }));
    } else if (splitType === "percentage") {
      const sum = members.reduce((s, m) => s + parseFloat(percentages[m.id] || "0"), 0);
      if (Math.abs(sum - 100) > 0.1) { addToast(`Percentages total ${sum.toFixed(1)}%, must equal 100%`, "error"); return; }
      shares = members.map((m) => {
        const pct = parseFloat(percentages[m.id] || "0");
        return { memberId: m.id, amount: (pct / 100) * numAmount, splitValue: pct, splitType: "percentage" };
      });
    } else {
      const totalShares = members.reduce((s, m) => s + parseFloat(shareCount[m.id] || "1"), 0);
      shares = members.map((m) => {
        const sc = parseFloat(shareCount[m.id] || "1");
        return { memberId: m.id, amount: (sc / totalShares) * numAmount, splitType: "shares" };
      });
    }

    onSave({ ...expense, title: title.trim(), totalAmount: numAmount, currency, exchangeRate: numRate, payerId, date, shares, categories: categories.length > 0 ? categories : undefined, notes: notes.trim() || undefined });
    addToast("Expense updated", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit expense">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl p-4 max-h-[85vh] overflow-y-auto animate-scaleIn card-elevated">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Edit Expense</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]" style={{ background: "var(--surface)" }} aria-label="Close">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Title *</label>
            <input className="w-full rounded-lg px-3 py-2 text-sm min-h-[44px]" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Amount *</label>
              <input className="w-full rounded-lg px-3 py-2 text-sm tabular-nums min-h-[44px]" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Currency</label>
              <select className="w-full rounded-lg px-3 py-2 text-sm min-h-[44px]" value={currency} onChange={(e) => { const v = e.target.value as CurrencyCode; setCurrency(v); setRate(String(1)); }}>
                {Object.keys(CURRENCY_MAP).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_140px] gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Date *</label>
              <input className="w-full rounded-lg px-3 py-2 text-sm min-h-[44px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Rate to {baseSymbol}</label>
              <input className="w-full rounded-lg px-3 py-2 text-sm tabular-nums min-h-[44px]" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Paid by *</label>
            <div className="flex gap-2">
              {members.map((m) => (
                <button key={m.id} onClick={() => setPayerId(m.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${payerId === m.id ? "text-white shadow-lg shadow-orange-500/25" : ""}`}
                  style={{ background: payerId === m.id ? "var(--accent)" : "var(--border)", color: payerId === m.id ? "white" : "var(--text-secondary)" }}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((cat) => (
                <button key={cat} onClick={() => toggleCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all min-h-[32px] ${categories.includes(cat) ? "gradient-accent text-white font-semibold" : ""}`}
                  style={!categories.includes(cat) ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}>
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Split type</label>
            <div className="grid grid-cols-4 gap-1.5 rounded-lg p-1" style={{ background: "var(--surface)" }}>
              {(["equal", "exact", "percentage", "shares"] as SplitType[]).map((st) => (
                <button key={st} onClick={() => setSplitType(st)}
                  className={`py-2 rounded-md text-xs font-medium capitalize transition-all ${splitType === st ? "text-white shadow" : ""}`}
                  style={{ background: splitType === st ? "var(--accent)" : "transparent", color: splitType === st ? "white" : "var(--text-secondary)" }}>
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Split {splitType === "exact" ? "amounts" : splitType === "percentage" ? "percentages" : splitType === "shares" ? "shares" : "equally"} *</label>
            <div className="rounded-xl p-3" style={{ background: "var(--surface)" }}>
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  {splitType === "equal" ? (
                    <span className="text-sm font-mono tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {(numAmount / members.length).toFixed(2)} {baseSymbol}
                    </span>
                  ) : splitType === "exact" ? (
                    <input className="w-24 rounded-lg px-3 py-2 text-sm text-right tabular-nums min-h-[36px]"
                      value={exactAmounts[m.id] || ""} onChange={(e) => setExactAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="0.00" inputMode="decimal" />
                  ) : splitType === "percentage" ? (
                    <div className="flex items-center gap-2">
                      <input className="w-20 rounded-lg px-3 py-2 text-sm text-right tabular-nums min-h-[36px]"
                        value={percentages[m.id] || ""} onChange={(e) => setPercentages((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="0" inputMode="decimal" />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input className="w-20 rounded-lg px-3 py-2 text-sm text-right tabular-nums min-h-[36px]"
                        value={shareCount[m.id] || ""} onChange={(e) => setShareCount((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="1" inputMode="numeric" />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>shares</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea className="w-full rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white gradient-accent shadow-lg shadow-orange-500/25 transition-all btn-press min-h-[44px] flex items-center justify-center gap-2">
              <CheckIcon className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
