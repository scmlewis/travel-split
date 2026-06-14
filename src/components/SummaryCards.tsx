import { useMemo } from "react";
import type { Expense, Member, ExpenseCategory } from "../types";
import { EXPENSE_CATEGORIES } from "../types";

interface SummaryCardsProps {
  expenses: Expense[];
  members: Member[];
  baseSymbol: string;
}

export default function SummaryCards({ expenses, members, baseSymbol }: SummaryCardsProps) {
  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
  const avgPerPerson = members.length > 0 ? totalSpent / members.length : 0;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || "other";
      map[cat] = (map[cat] || 0) + e.totalAmount * e.exchangeRate;
    }
    return Object.entries(map)
      .map(([key, amount]) => ({ key: key as ExpenseCategory, amount }))
      .filter((c) => c.amount > 0.01)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const cards = [
    { label: "Total Spent", value: `${baseSymbol}${totalSpent.toFixed(2)}` },
    { label: "Per Person", value: `${baseSymbol}${avgPerPerson.toFixed(2)}` },
    { label: "Expenses", value: String(expenses.length) },
    { label: "Members", value: String(members.length) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="glass-card px-3 sm:px-4 py-3 animate-fadeIn">
            <div className="text-xs sm:text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</div>
            <div className="text-lg sm:text-2xl font-bold tabular-nums mt-1 truncate" style={{ color: "var(--text-primary)" }}>{card.value}</div>
          </div>
        ))}
      </div>
      {categoryBreakdown.length > 0 && (
        <div className="glass-card px-4 py-3 animate-fadeIn">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>By Category</div>
          <div className="space-y-2">
            {categoryBreakdown.map((cat) => {
              const info = EXPENSE_CATEGORIES[cat.key];
              const pct = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between text-sm mb-0.5">
                    <span style={{ color: "var(--text-secondary)" }}>{info?.label ?? cat.key}</span>
                    <span className="font-mono tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{baseSymbol}{cat.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full gradient-accent opacity-60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
