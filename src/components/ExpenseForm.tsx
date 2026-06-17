import { useState, useMemo } from "react";
import type { Member, CurrencyCode, OmitExpenseId, SplitType, ExpenseItem } from "../types";
import { CURRENCY_MAP, getCategoryLabel, todayString, generateId } from "../types";
import { useToast } from "../hooks/useToast";
import { CheckIcon, RepeatIcon } from "./Icons";

interface ExpenseFormProps {
  members: Member[];
  baseSymbol: string;
  exchangeRates: Record<CurrencyCode, number>;
  allCategories: string[];
  onAdd: (expense: OmitExpenseId) => void;
}

export default function ExpenseForm({ members, baseSymbol, exchangeRates, allCategories, onAdd }: ExpenseFormProps) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("HKD");
  const [rate, setRate] = useState(() => String(exchangeRates.HKD));
  const [payerId, setPayerId] = useState("");
  const [date, setDate] = useState(todayString());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [payers, setPayers] = useState<Record<string, string>>({});
  const [useMultiPayer, setUseMultiPayer] = useState(false);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [useItems, setUseItems] = useState(false);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expenseCreatedAt] = useState(() => Date.now());

  const handleCurrencyChange = (c: CurrencyCode) => { setCurrency(c); setRate(String(exchangeRates[c])); };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 1;

  const currentSharesSum = useMemo(() => Object.values(customShares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), [customShares]);
  const diff = amountNum - currentSharesSum;

  const currentPayersSum = useMemo(() => Object.values(payers).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), [payers]);
  const payerDiff = amountNum - currentPayersSum;

  const handleAddItem = () => { setItems([...items, { id: generateId(), title: "", amount: 0, assignedTo: [] }]); };

  const handleUpdateItem = (id: string, field: keyof ExpenseItem, value: ExpenseItem[keyof ExpenseItem]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRemoveItem = (id: string) => { setItems(items.filter((item) => item.id !== id)); };

  const toggleItemMember = (itemId: string, memberId: string) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      const assigned = item.assignedTo.includes(memberId) ? item.assignedTo.filter((id) => id !== memberId) : [...item.assignedTo, memberId];
      return { ...item, assignedTo: assigned };
    }));
  };

  const computeSharesFromItems = (): { memberId: string; amount: number }[] => {
    if (!useItems || items.length === 0) return [];
    const shareMap: Record<string, number> = {};
    for (const m of members) shareMap[m.id] = 0;
    for (const item of items) {
      if (item.assignedTo.length === 0 || item.amount <= 0) continue;
      const perPerson = item.amount / item.assignedTo.length;
      for (const memberId of item.assignedTo) shareMap[memberId] = (shareMap[memberId] || 0) + perPerson;
    }
    return Object.entries(shareMap).filter(([, v]) => v > 0.01).map(([memberId, amount]) => ({ memberId, amount: Math.round(amount * 100) / 100 }));
  };

  const handleSubmit = () => {
    const finalTitle = title.trim();
    if (!finalTitle) { addToast("Title cannot be empty", "error"); return; }
    if (amountNum <= 0) { addToast("Amount must be greater than 0", "error"); return; }
    if (!payerId) { addToast("Please select who paid", "error"); return; }
    if (members.length === 0) { addToast("Add at least one member", "error"); return; }

    let shares: { memberId: string; amount: number; splitType?: SplitType; splitValue?: number }[];

    if (useItems && items.length > 0) {
      shares = computeSharesFromItems();
      if (shares.length === 0) { addToast("Assign items to members", "error"); return; }
    } else if (splitType === "equal") {
      const perPerson = amountNum / members.length;
      shares = members.map((m) => ({ memberId: m.id, amount: Math.round(perPerson * 100) / 100, splitType: "equal" as SplitType }));
      const error = amountNum - shares.reduce((s, sh) => s + sh.amount, 0);
      if (Math.abs(error) > 0.01) shares[shares.length - 1].amount += error;
    } else if (splitType === "exact") {
      if (Math.abs(diff) > 0.01) { addToast("Shares must sum to total", "error"); return; }
      shares = members.filter((m) => (parseFloat(customShares[m.id] ?? "") || 0) > 0).map((m) => ({ memberId: m.id, amount: parseFloat(customShares[m.id]!), splitType: "exact", splitValue: parseFloat(customShares[m.id]!) }));
    } else if (splitType === "percentage") {
      const totalPct = Object.values(customShares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.5) { addToast("Percentages must total 100%", "error"); return; }
      shares = members.filter((m) => (parseFloat(customShares[m.id] ?? "") || 0) > 0).map((m) => {
        const pct = parseFloat(customShares[m.id]!) || 0;
        return { memberId: m.id, amount: Math.round(amountNum * pct / 100 * 100) / 100, splitType: "percentage" as SplitType, splitValue: pct };
      });
    } else {
      const totalShares = Object.values(customShares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (totalShares <= 0) { addToast("Add shares for at least one member", "error"); return; }
      shares = members.filter((m) => (parseFloat(customShares[m.id] ?? "") || 0) > 0).map((m) => {
        const sh = parseFloat(customShares[m.id]!) || 0;
        return { memberId: m.id, amount: Math.round(amountNum * sh / totalShares * 100) / 100, splitType: "shares" as SplitType, splitValue: sh };
      });
    }

    let finalPayerId = payerId;
    let payersData = undefined;
    if (useMultiPayer && Object.keys(payers).length > 0) {
      const payerEntries = Object.entries(payers).filter(([, v]) => (parseFloat(v) || 0) > 0);
      if (payerEntries.length > 0) { finalPayerId = payerEntries[0][0]; payersData = payerEntries.map(([memberId, amt]) => ({ memberId, amount: parseFloat(amt) })); }
    }

    onAdd({
      title: finalTitle, totalAmount: amountNum, currency, exchangeRate: rateNum, payerId: finalPayerId, shares, createdAt: expenseCreatedAt, date,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      notes: notes.trim() || undefined, items: useItems && items.length > 0 ? items : undefined, payers: payersData,
      recurring: recurringEnabled ? { enabled: true, frequency: recurringFreq } : undefined,
    });

    addToast(`Added "${finalTitle}"`);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); setAmount(""); setCurrency("HKD"); setRate(String(exchangeRates.HKD));
    setPayerId(""); setDate(todayString()); setSelectedCategories([]); setNotes("");
    setSplitType("equal"); setCustomShares({}); setPayers({}); setUseMultiPayer(false);
    setItems([]); setUseItems(false); setRecurringEnabled(false); setRecurringFreq("monthly"); setShowAdvanced(false);
  };

  const inactiveBtn = { background: "var(--border)", color: "var(--text-secondary)" };

  return (
    <div className="card p-4 space-y-3">
      <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Add Expense</div>

      <div>
        <label htmlFor="expense-title" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Title</label>
        <input id="expense-title" className="w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px]" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hotel, Dinner" />
      </div>

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

      <div>
        <select className="w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px]" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          <option value="">Who paid?</option>
          {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Categories</label>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <button key={cat} onClick={() => toggleCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all min-h-[32px] ${selectedCategories.includes(cat) ? "gradient-accent text-white font-semibold" : ""}`}
              style={!selectedCategories.includes(cat) ? inactiveBtn : undefined}>
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
        {selectedCategories.length > 1 && (
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{selectedCategories.length} categories selected</div>
        )}
      </div>

      <div>
        <div className="flex gap-1.5 mb-2">
          {(["equal", "exact", "percentage", "shares"] as SplitType[]).map((st) => (
            <button key={st} onClick={() => { setSplitType(st); setUseItems(false); }}
              className={`text-xs px-3 py-2 rounded-lg transition-all min-h-[36px] capitalize ${splitType === st && !useItems ? "gradient-accent text-white font-semibold" : ""}`}
              style={splitType !== st || useItems ? inactiveBtn : undefined}>
              {st}
            </button>
          ))}
        </div>

        {!useItems && (
          <>
            {splitType === "equal" && (
              <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Each pays {baseSymbol}{(amountNum / (members.length || 1)).toFixed(2)}
              </div>
            )}
            {splitType !== "equal" && (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="w-20 truncate font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                    <input className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[44px] font-mono" type="number" min="0" step="0.01"
                      value={customShares[m.id] ?? ""} onChange={(e) => setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder={splitType === "percentage" ? "%" : splitType === "shares" ? "shares" : "amount"} />
                    <span className="text-xs w-8" style={{ color: "var(--text-muted)" }}>{splitType === "percentage" ? "%" : splitType === "shares" ? "sh" : baseSymbol}</span>
                  </div>
                ))}
                {splitType === "percentage" && (
                  <div className={`text-xs font-medium ${Math.abs(currentSharesSum - 100) < 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {Math.abs(currentSharesSum - 100) < 0.5 ? <span className="flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Total: 100%</span> : `Total: ${currentSharesSum.toFixed(1)}%`}
                  </div>
                )}
                {splitType === "exact" && (
                  <div className={`text-xs font-medium ${Math.abs(diff) < 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {Math.abs(diff) < 0.01 ? <span className="flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Balanced</span> : `Remaining: ${baseSymbol}${diff.toFixed(2)}`}
                  </div>
                )}
                {splitType === "shares" && (
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Total: {Object.values(customShares).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(0)} shares
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-medium w-full text-left py-1" style={{ color: "var(--accent)" }}>
        {showAdvanced ? "- Hide advanced" : "+ Show advanced"}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
            <input className="w-full rounded-lg px-3 py-2 text-sm min-h-[44px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Multiple payers</span>
            <button onClick={() => setUseMultiPayer(!useMultiPayer)}
              className={`w-10 h-5 rounded-full transition-colors relative ${useMultiPayer ? "bg-[var(--accent)]" : ""}`}
              style={!useMultiPayer ? { background: "var(--border)" } : undefined}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useMultiPayer ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          {useMultiPayer && (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="w-20 truncate font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  <input className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[44px] font-mono" type="number" min="0" step="0.01"
                    value={payers[m.id] ?? ""} onChange={(e) => setPayers((prev) => ({ ...prev, [m.id]: e.target.value }))} placeholder="0" />
                </div>
              ))}
              <div className={`text-xs font-medium ${Math.abs(payerDiff) < 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {Math.abs(payerDiff) < 0.01 ? <span className="flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Payers balanced</span> : `Remaining: ${baseSymbol}${payerDiff.toFixed(2)}`}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Item-level split</span>
            <button onClick={() => { setUseItems(!useItems); if (!useItems) handleAddItem(); }}
              className={`w-10 h-5 rounded-full transition-colors relative ${useItems ? "bg-[var(--accent)]" : ""}`}
              style={!useItems ? { background: "var(--border)" } : undefined}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useItems ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          {useItems && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="p-2 rounded-lg" style={{ background: "var(--surface-elevated)" }}>
                  <div className="flex gap-2 mb-1.5">
                    <input className="flex-1 rounded-lg px-3 py-1.5 text-sm" value={item.title} onChange={(e) => handleUpdateItem(item.id, "title", e.target.value)} placeholder="Item name" />
                    <input className="w-20 rounded-lg px-2 py-1.5 text-sm font-mono" type="number" min="0" step="0.01" value={item.amount || ""} onChange={(e) => handleUpdateItem(item.id, "amount", parseFloat(e.target.value) || 0)} placeholder="0" />
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 px-1">×</button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {members.map((m) => (
                      <button key={m.id} onClick={() => toggleItemMember(item.id, m.id)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${item.assignedTo.includes(m.id) ? "gradient-accent text-white" : ""}`}
                        style={!item.assignedTo.includes(m.id) ? inactiveBtn : undefined}>
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={handleAddItem} className="text-xs font-medium w-full py-2 rounded-lg" style={{ background: "var(--border)", color: "var(--accent)" }}>+ Add item</button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><RepeatIcon className="w-3.5 h-3.5" /> Recurring</span>
            <button onClick={() => setRecurringEnabled(!recurringEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${recurringEnabled ? "bg-[var(--accent)]" : ""}`}
              style={!recurringEnabled ? { background: "var(--border)" } : undefined}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${recurringEnabled ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          {recurringEnabled && (
            <div className="flex gap-1.5">
              {(["weekly", "monthly", "yearly"] as const).map((f) => (
                <button key={f} onClick={() => setRecurringFreq(f)}
                  className={`text-xs px-3 py-2 rounded-lg flex-1 capitalize min-h-[36px] ${recurringFreq === f ? "gradient-accent text-white font-semibold" : ""}`}
                  style={recurringFreq !== f ? inactiveBtn : undefined}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={handleSubmit}
        className="w-full gradient-accent text-white text-sm py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed btn-press min-h-[48px]"
        disabled={splitType !== "equal" && !useItems && Math.abs(diff) > 0.01}>
        Add Expense
      </button>
    </div>
  );
}
