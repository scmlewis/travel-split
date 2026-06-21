import { useMemo } from "react";
import type { Expense, CurrencyCode } from "../types";
import { CURRENCY_MAP } from "../types";

interface SummaryCardsProps {
  expenses: Expense[];
  memberCount: number;
  baseSymbol: string;
  budget?: number;
  baseCurrency?: CurrencyCode;
}

export default function SummaryCards({ expenses, memberCount, baseSymbol, budget, baseCurrency }: SummaryCardsProps) {
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.totalAmount * e.exchangeRate, 0), [expenses]);
  const perPerson = memberCount > 0 ? totalSpent / memberCount : 0;

  const stats = [
    { label: "Total Spent", value: `${baseSymbol}${totalSpent.toFixed(2)}`, accent: true },
    { label: "Per Person", value: `${baseSymbol}${perPerson.toFixed(2)}` },
  ];

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--md-sys-color-primary)" }} />
        Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-4">
            <div className="text-xs mb-1 truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{s.label}</div>
            <div className="text-lg font-bold tabular-nums font-mono" style={{ color: s.accent ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface)" }}>
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
          <div className="card-elevated p-4 mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Budget</div>
              <div className="text-xs font-medium" style={{ color: over ? "var(--md-sys-color-error)" : "var(--md-sys-color-on-surface-variant)" }}>
                {sym}{totalSpent.toFixed(2)} / {sym}{budget.toFixed(2)}
              </div>
            </div>
            <div className={`md-linear-progress ${over ? "md-linear-progress-error" : ""}`}>
              <div className="md-linear-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{pct.toFixed(0)}% used</span>
              <span className="text-[10px] font-medium" style={{ color: over ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)" }}>
                {over ? `Over by ${sym}${(totalSpent - budget).toFixed(2)}` : `${sym}${remaining.toFixed(2)} remaining`}
              </span>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
