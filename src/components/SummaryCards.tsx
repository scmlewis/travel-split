import { useMemo } from "react";
import type { Expense, CurrencyCode } from "../types";
import { getCategoryLabel, CURRENCY_MAP } from "../types";

interface SummaryCardsProps {
  expenses: Expense[];
  memberCount: number;
  baseSymbol: string;
  allCategories: string[];
  budget?: number;
  baseCurrency?: CurrencyCode;
}

export default function SummaryCards({ expenses, memberCount, baseSymbol, allCategories, budget, baseCurrency }: SummaryCardsProps) {
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.totalAmount * e.exchangeRate, 0), [expenses]);
  const perPerson = memberCount > 0 ? totalSpent / memberCount : 0;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    const totals: Record<string, number> = {};
    for (const exp of expenses) {
      const cats = exp.categories && exp.categories.length > 0 ? exp.categories : ["other"];
      const perCatAmt = exp.totalAmount * exp.exchangeRate / cats.length;
      for (const c of cats) {
        counts[c] = (counts[c] || 0) + 1;
        totals[c] = (totals[c] || 0) + perCatAmt;
      }
    }
    return allCategories.filter((c) => counts[c]).map((c) => ({ id: c, label: getCategoryLabel(c), count: counts[c], total: totals[c] })).sort((a, b) => b.total - a.total);
  }, [expenses, allCategories]);

  const maxCat = categoryBreakdown.length > 0 ? categoryBreakdown[0].total : 1;

  const stats = [
    { label: "Total Spent", value: `${baseSymbol}${totalSpent.toFixed(2)}`, accent: true },
    { label: "Per Person", value: `${baseSymbol}${perPerson.toFixed(2)}` },
    { label: "Expenses", value: String(expenses.length) },
    { label: "Members", value: String(memberCount) },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Summary
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 rounded-xl">
            <div className="text-xs mb-1 truncate" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className={`text-lg font-bold tabular-nums font-mono ${s.accent ? "" : ""}`} style={{ color: s.accent ? "var(--accent)" : "var(--text-primary)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      {budget != null && budget > 0 && (() => {
        const pct = Math.min((totalSpent / budget) * 100, 100);
        const over = totalSpent > budget;
        const remaining = Math.max(budget - totalSpent, 0);
        const sym = baseCurrency ? (CURRENCY_MAP[baseCurrency]?.symbol ?? baseCurrency) : "";
        return (
          <div className="card p-3 mt-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Budget</div>
              <div className="text-xs font-medium" style={{ color: over ? "#f87171" : "var(--text-secondary)" }}>
                {sym}{totalSpent.toFixed(2)} / {sym}{budget.toFixed(2)}
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: over ? "#f87171" : "#34d399" }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% used</span>
              <span className="text-[10px] font-medium" style={{ color: over ? "#f87171" : "#34d399" }}>
                {over ? `Over by ${sym}${(totalSpent - budget).toFixed(2)}` : `${sym}${remaining.toFixed(2)} remaining`}
              </span>
            </div>
          </div>
        );
      })()}
      {categoryBreakdown.length > 0 && (
        <div className="card p-3 mt-3 rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Spending by Category
          </div>
          <div className="space-y-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-secondary)" }}>{cat.label} ({cat.count})</span>
                  <span className="font-mono tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{baseSymbol}{cat.total.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full gradient-accent transition-all duration-500" style={{ width: `${(cat.total / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
