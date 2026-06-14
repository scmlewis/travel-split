import { useState, useEffect } from "react";
import type { Expense, Member, CurrencyCode, ExpenseShare, SplitType, ExpenseCategory } from "../types";
import { CURRENCY_MAP, EXPENSE_CATEGORIES } from "../types";
import { useToast } from "../hooks/useToast";
import { XIcon, CheckIcon } from "./Icons";

interface EditExpenseModalProps {
  expense: Expense;
  members: Member[];
  baseSymbol: string;
  exchangeRates: Record<CurrencyCode, number>;
  onSave: (updated: Expense) => void;
  onClose: () => void;
}

export default function EditExpenseModal({ expense, members, baseSymbol, exchangeRates, onSave, onClose }: EditExpenseModalProps) {
  const { addToast } = useToast();
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.totalAmount));
  const [currency, setCurrency] = useState<CurrencyCode>(expense.currency);
  const [rate, setRate] = useState(String(expense.exchangeRate));
  const [payerId, setPayerId] = useState(expense.payerId);
  const [date, setDate] = useState(expense.date);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category || "other");
  const [notes, setNotes] = useState(expense.notes || "");
  const [splitType, setSplitType] = useState<SplitType>(expense.shares[0]?.splitType || "equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of expense.shares) map[s.memberId] = String(s.amount);
    return map;
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 1;
  const currentSharesSum = Object.values(customShares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const diff = amountNum - currentSharesSum;

  const handleCurrencyChange = (c: CurrencyCode) => { setCurrency(c); setRate(String(exchangeRates[c])); };

  const handleSubmit = () => {
    const finalTitle = title.trim();
    if (!finalTitle) { addToast("Title cannot be empty", "error"); return; }
    if (amountNum <= 0) { addToast("Amount must be greater than 0", "error"); return; }
    if (!payerId) { addToast("Please select who paid", "error"); return; }

    let shares: ExpenseShare[];
    if (splitType === "equal") {
      const perPerson = amountNum / members.length;
      shares = members.map((m) => ({ memberId: m.id, amount: Math.round(perPerson * 100) / 100, splitType: "equal" }));
      const error = amountNum - shares.reduce((s, sh) => s + sh.amount, 0);
      if (Math.abs(error) > 0.01) shares[shares.length - 1].amount += error;
    } else {
      if (Math.abs(diff) > 0.01) { addToast("Shares must sum exactly to total", "error"); return; }
      shares = members
        .filter((m) => (parseFloat(customShares[m.id] ?? "") || 0) > 0)
        .map((m) => ({ memberId: m.id, amount: parseFloat(customShares[m.id]!), splitType }));
    }

    onSave({ ...expense, title: finalTitle, totalAmount: amountNum, currency, exchangeRate: rateNum, payerId, shares, date, category, notes: notes.trim() || undefined });
    addToast(`Updated "${finalTitle}"`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative glass-elevated rounded-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Edit Expense</h3>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <input className="w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px]" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />

        <div className="flex gap-2">
          <input className="flex-1 rounded-lg px-3 py-2.5 text-sm min-h-[44px]" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
          <select className="w-24 rounded-lg px-3 py-2.5 text-sm min-h-[44px] font-medium" value={currency} onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}>
            {(Object.keys(CURRENCY_MAP) as CurrencyCode[]).map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>Rate:</span>
          <input className="w-28 rounded-lg px-3 py-2 text-sm min-h-[44px] font-mono" type="number" min="0" step="0.001" value={rate} onChange={(e) => setRate(e.target.value)} />
          <span className="font-medium text-sm">= {baseSymbol}{(amountNum * rateNum).toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Date:</span>
          <input className="flex-1 rounded-lg px-3 py-2.5 text-sm min-h-[44px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <select className="w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px]" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          <option value="">Who paid?</option>
          {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, { label: string; emoji: string }][]).map(([key, info]) => (
              <button key={key} onClick={() => setCategory(key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all min-h-[32px] ${category === key ? "gradient-accent text-white font-semibold" : ""}`}
                style={category !== key ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}>
                {info.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
          <input className="w-full rounded-lg px-3 py-2 text-sm min-h-[44px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        <div>
          <div className="flex gap-1.5 mb-2">
            {(["equal", "exact", "percentage", "shares"] as SplitType[]).map((st) => (
              <button key={st} onClick={() => setSplitType(st)}
                className={`text-xs px-3 py-2 rounded-lg transition-all min-h-[36px] capitalize ${splitType === st ? "gradient-accent text-white font-semibold" : ""}`}
                style={splitType !== st ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}>
                {st}
              </button>
            ))}
          </div>
          {splitType === "equal" ? (
            <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Each pays {baseSymbol}{(amountNum / (members.length || 1)).toFixed(2)}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="w-20 truncate font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  <input className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[44px] font-mono" type="number" min="0" step="0.01"
                    value={customShares[m.id] ?? ""} onChange={(e) => setCustomShares({ ...customShares, [m.id]: e.target.value })}
                    placeholder={splitType === "percentage" ? "%" : splitType === "shares" ? "shares" : "amount"} />
                </div>
              ))}
              <div className={`text-xs mt-1 font-medium ${Math.abs(diff) < 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {Math.abs(diff) < 0.01 ? <span className="flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Balanced</span> : `Remaining: ${baseSymbol}${diff.toFixed(2)}`}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={splitType !== "equal" && Math.abs(diff) > 0.01}
            className="flex-1 gradient-accent text-white text-sm py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed btn-press min-h-[48px]">
            Save Changes
          </button>
          <button onClick={onClose} className="text-sm hover:opacity-70 transition-opacity px-4 py-3 font-medium min-h-[48px]" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
