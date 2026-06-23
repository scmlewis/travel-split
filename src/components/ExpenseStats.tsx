import type { Member } from "../types";
import { useExpenseStats } from "../hooks/useExpenseStats";
import { getCategoryLabel } from "../types";
import Avatar from "./Avatar";

interface ExpenseStatsProps {
  expenses: import("../types").Expense[];
  members: Member[];
  baseSymbol: string;
}

export default function ExpenseStats({ expenses, members, baseSymbol }: ExpenseStatsProps) {
  const stats = useExpenseStats(expenses, members);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  if (stats.expenseCount === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          Statistics
        </h2>
        <div className="card-elevated text-center py-12 px-4 animate-fadeIn">
          <div className="text-lg font-medium mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>No data yet</div>
          <div className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Add expenses to see statistics</div>
        </div>
      </section>
    );
  }

  const maxDay = Math.max(...stats.spendingByDay.map((d) => d.total), 1);
  const maxWeek = Math.max(...stats.spendingByWeek.map((w) => w.total), 1);
  const maxMemberPaid = Math.max(...stats.memberSpending.map((m) => m.totalPaid), 1);
  const maxCat = stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown[0].total : 1;

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Statistics
      </h2>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Spent" value={`${baseSymbol}${stats.totalSpent.toFixed(2)}`} accent />
        <StatCard label="Avg Expense" value={`${baseSymbol}${stats.averageExpense.toFixed(2)}`} />
        <StatCard label="Daily Burn" value={`${baseSymbol}${stats.dailyBurnRate.toFixed(2)}`} />
        <StatCard label="Trip Duration" value={`${stats.tripDuration}d`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Expenses" value={String(stats.expenseCount)} />
        <StatCard label="Members" value={String(members.length)} />
        <StatCard label="Recurring" value={`${stats.recurringCount}`} />
        <StatCard label="One-time" value={baseSymbol + stats.oneTimeTotal.toFixed(0)} />
      </div>

      {/* Largest / Smallest expense */}
      {stats.largestExpense && (
        <div className="card-elevated p-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Largest Expense</div>
              <div className="text-base font-bold" style={{ color: "var(--md-sys-color-on-surface)" }}>{stats.largestExpense.title}</div>
              <div className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                {stats.largestExpense.date} · {memberMap.get(stats.largestExpense.payerId)?.name ?? "?"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: "var(--md-sys-color-primary)" }}>
                {baseSymbol}{(stats.largestExpense.totalAmount * stats.largestExpense.exchangeRate).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending by day */}
      {stats.spendingByDay.length > 1 && (
        <div className="card-elevated p-4 animate-fadeIn">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Spending by Day</div>
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-end gap-1" style={{ paddingBottom: "18px" }}>
              {stats.spendingByDay.map((d) => (
                <div key={d.date} className="flex-1 min-w-0 flex justify-center">
                  <div
                    className="w-full rounded-t-md gradient-accent transition-all duration-300"
                    style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total > 0 ? "4px" : "0px", opacity: 0.8 }}
                    title={`${d.date}: ${baseSymbol}${d.total.toFixed(2)}`}
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 inset-x-0 flex gap-1">
              {stats.spendingByDay.map((d) => (
                <div key={d.date} className="flex-1 min-w-0 text-center">
                  <div className="text-[8px] truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {d.date.slice(5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spending by week */}
      {stats.spendingByWeek.length > 1 && (
        <div className="card-elevated p-4 animate-fadeIn">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Spending by Week</div>
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-end gap-2" style={{ paddingBottom: "18px" }}>
              {stats.spendingByWeek.map((w) => (
                <div key={w.date} className="flex-1 min-w-0 flex justify-center">
                  <div
                    className="w-full rounded-t-md gradient-accent transition-all duration-300"
                    style={{ height: `${(w.total / maxWeek) * 100}%`, minHeight: w.total > 0 ? "4px" : "0px", opacity: 0.8 }}
                    title={`Week of ${w.date}: ${baseSymbol}${w.total.toFixed(2)}`}
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 inset-x-0 flex gap-2">
              {stats.spendingByWeek.map((w) => (
                <div key={w.date} className="flex-1 min-w-0 text-center">
                  <div className="text-[8px] truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {w.date.slice(5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-member spending */}
      <div className="card-elevated p-4 animate-fadeIn">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Spending by Member</div>
        <div className="space-y-3">
          {stats.memberSpending
            .slice()
            .sort((a, b) => b.totalPaid - a.totalPaid)
            .map((ms, idx) => {
              const member = memberMap.get(ms.memberId);
              return (
                <div key={ms.memberId} className="transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={member?.name ?? "?"} size="sm" />
                      <span style={{ color: "var(--md-sys-color-on-surface)" }}>{member?.name ?? "?"}</span>
                      <span className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{ms.expenseCount} expenses</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                      {baseSymbol}{ms.totalPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--md-sys-color-outline-variant)" }}>
                    <div
                      className="h-full rounded-full gradient-accent transition-all duration-500"
                      style={{ width: `${(ms.totalPaid / maxMemberPaid) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Category breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="card-elevated p-4 animate-fadeIn">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>By Category</div>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat, idx) => (
              <div key={cat.category} className="transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span style={{ color: "var(--md-sys-color-on-surface)" }}>{getCategoryLabel(cat.category)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{cat.count}x</span>
                    <span className="font-mono tabular-nums font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                      {baseSymbol}{cat.total.toFixed(2)}
                    </span>
                    <span className="text-xs w-10 text-right" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--md-sys-color-outline-variant)" }}>
                  <div
                    className="h-full rounded-full gradient-accent transition-all duration-500"
                    style={{ width: `${(cat.total / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currency breakdown */}
      {stats.currencyBreakdown.length > 1 && (
        <div className="card-elevated p-4 animate-fadeIn">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>By Currency</div>
          <div className="space-y-2">
            {stats.currencyBreakdown.map((cb, idx) => (
              <div key={cb.currency} className="flex items-center justify-between text-sm py-1 transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms`, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
                <div>
                  <span className="font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>{cb.currency}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{cb.count}x</span>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums" style={{ color: "var(--md-sys-color-on-surface)" }}>
                    {baseSymbol}{cb.totalConverted.toFixed(2)}
                  </span>
                  {cb.currency !== "HKD" && (
                    <div className="text-[10px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      ({cb.totalOriginal.toFixed(0)} {cb.currency})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-elevated p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider mb-1 truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{label}</div>
      <div className="text-lg font-bold tabular-nums font-mono tracking-tight" style={{ color: accent ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface)" }}>
        {value}
      </div>
    </div>
  );
}
