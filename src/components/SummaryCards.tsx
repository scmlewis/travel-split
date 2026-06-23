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

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Total Spent</div>
          <div className="text-[28px] leading-tight font-semibold tabular-nums font-mono tracking-tight" style={{ color: "var(--md-sys-color-primary)" }}>
            {baseSymbol}{totalSpent.toFixed(2)}
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Per Person</div>
          <div className="text-[28px] leading-tight font-semibold tabular-nums font-mono tracking-tight" style={{ color: "var(--md-sys-color-on-surface)" }}>
            {baseSymbol}{perPerson.toFixed(2)}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      {budget != null && budget > 0 && (() => {
        const pct = Math.min((totalSpent / budget) * 100, 100);
        const over = totalSpent > budget;
        const remaining = Math.max(budget - totalSpent, 0);
        const sym = baseCurrency ? (CURRENCY_MAP[baseCurrency]?.symbol ?? baseCurrency) : "";
        return (
          <div className="card-elevated p-4 mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Budget</div>
              <div className="text-xs font-medium tabular-nums font-mono" style={{ color: over ? "var(--md-sys-color-error)" : "var(--md-sys-color-on-surface-variant)" }}>
                {sym}{totalSpent.toFixed(0)} / {sym}{budget.toFixed(0)}
              </div>
            </div>
            <div className={`md-linear-progress ${over ? "md-linear-progress-error" : ""}`}>
              <div className="md-linear-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-semibold" style={{ color: over ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)" }}>
                {over ? `Over by ${sym}${(totalSpent - budget).toFixed(2)}` : `${sym}${remaining.toFixed(2)} left`}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{pct.toFixed(0)}%</span>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
