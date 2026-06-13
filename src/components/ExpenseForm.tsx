import { useState } from "react";
import type { Member, CurrencyCode, OmitExpenseId } from "../types";
import { CURRENCY_MAP, todayString } from "../types";
import { useToast } from "../hooks/useToast";

interface ExpenseFormProps {
  members: Member[];
  baseSymbol: string;
  exchangeRates: Record<CurrencyCode, number>;
  onAdd: (expense: OmitExpenseId) => void;
}

export default function ExpenseForm({ members, baseSymbol, exchangeRates, onAdd }: ExpenseFormProps) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("HKD");
  const [rate, setRate] = useState(String(exchangeRates.HKD));
  const [payerId, setPayerId] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [date, setDate] = useState(todayString());

  const handleCurrencyChange = (c: CurrencyCode) => {
    setCurrency(c);
    setRate(String(exchangeRates[c]));
  };

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 1;
  const baseEquivalent = amountNum * rateNum;

  const currentSharesSum = Object.values(customShares)
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const diff = amountNum - currentSharesSum;

  const handleSubmit = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      addToast("Title cannot be empty", "error");
      return;
    }
    if (amountNum <= 0) {
      addToast("Amount must be greater than 0", "error");
      return;
    }
    if (!payerId) {
      addToast("Please select who paid", "error");
      return;
    }
    if (members.length === 0) {
      addToast("Add at least one member to split expenses", "error");
      return;
    }

    let shares: { memberId: string; amount: number }[];
    if (splitMode === "equal") {
      const perPerson = amountNum / members.length;
      shares = members.map((m) => ({ memberId: m.id, amount: Math.round(perPerson * 100) / 100 }));
      const error = amountNum - shares.reduce((s, sh) => s + sh.amount, 0);
      if (Math.abs(error) > 0.01) shares[shares.length - 1].amount += error;
    } else {
      if (Math.abs(diff) > 0.01) {
        addToast("Custom shares must sum exactly to the total amount", "error");
        return;
      }
      shares = members
        .filter((m) => (parseFloat(customShares[m.id] ?? "") || 0) > 0)
        .map((m) => ({ memberId: m.id, amount: parseFloat(customShares[m.id]!) }));
    }

    onAdd({
      title: finalTitle,
      totalAmount: amountNum,
      currency,
      exchangeRate: rateNum,
      payerId,
      shares,
      createdAt: Date.now(),
      date,
    });

    addToast(`Added "${finalTitle}"`);
    setTitle("");
    setAmount("");
    setCurrency("HKD");
    setRate(String(exchangeRates.HKD));
    setPayerId("");
    setSplitMode("equal");
    setCustomShares({});
    setDate(todayString());
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px]";

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3 border border-slate-200 dark:border-slate-600">
      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Add Expense</div>
          <div>
            <label htmlFor="expense-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              id="expense-title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Hotel)"
              aria-required="true"
              aria-invalid={!title}
            />
            {!title && (
              <p className="text-xs text-red-500 mt-1">Title is required</p>
            )}
          </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px]"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <select
          className="w-24 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 min-h-[44px] font-medium"
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
        >
          {(Object.keys(CURRENCY_MAP) as CurrencyCode[]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Rate:</span>
        <input
          className="w-28 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 min-h-[44px] font-mono"
          type="number"
          min="0"
          step="0.001"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <span className="font-medium text-sm">= {baseSymbol}{baseEquivalent.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Date:</span>
        <input
          className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 min-h-[44px]"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <select
          className={inputClass}
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
        >
          <option value="">Who paid?</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSplitMode("equal")}
            className={`text-sm px-4 py-2.5 rounded-lg transition-colors font-medium min-h-[44px] ${splitMode === "equal" ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"}`}
          >
            Equal
          </button>
          <button
            onClick={() => setSplitMode("custom")}
            className={`text-sm px-4 py-2.5 rounded-lg transition-colors font-medium min-h-[44px] ${splitMode === "custom" ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"}`}
          >
            Custom
          </button>
        </div>
        {splitMode === "equal" ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Each pays {baseSymbol}{(amountNum / (members.length || 1)).toFixed(2)}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span className="w-20 truncate text-slate-600 dark:text-slate-300 font-medium">{m.name}</span>
                <input
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px] font-mono"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customShares[m.id] ?? ""}
                  onChange={(e) => setCustomShares({ ...customShares, [m.id]: e.target.value })}
                  placeholder="amount"
                />
              </div>
            ))}
            <div className={`text-xs mt-1 font-medium ${Math.abs(diff) < 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
              {Math.abs(diff) < 0.01 ? "✓ Balanced" : `Remaining: ${baseSymbol}${diff.toFixed(2)}`}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={splitMode === "custom" && Math.abs(diff) > 0.01}
        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white text-sm py-3 rounded-lg font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press min-h-[48px]"
      >
        Add Expense
      </button>
    </div>
  );
}
