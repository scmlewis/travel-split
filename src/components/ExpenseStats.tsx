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
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
          Statistics
        </h2>
        <div className="card text-center py-12 px-4 animate-fadeIn">
          <div className="text-lg font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No data yet</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see statistics</div>
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
      <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Statistics
      </h2>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Spent" value={`${baseSymbol}${stats.totalSpent.toFixed(2)}`} accent />
        <StatCard label="Avg Expense" value={`${baseSymbol}${stats.averageExpense.toFixed(2)}`} />
        <StatCard label="Daily Burn" value={`${baseSymbol}${stats.dailyBurnRate.toFixed(2)}`} />
        <StatCard label="Trip Duration" value={`${stats.tripDuration} day${stats.tripDuration !== 1 ? "s" : ""}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Expenses" value={String(stats.expenseCount)} />
        <StatCard label="Members" value={String(members.length)} />
        <StatCard label="Recurring" value={`${stats.recurringCount} (${baseSymbol}${stats.recurringTotal.toFixed(0)})`} />
        <StatCard label="One-time" value={baseSymbol + stats.oneTimeTotal.toFixed(0)} />
      </div>

      {/* Largest / Smallest expense */}
      {stats.largestExpense && (
        <div className="card p-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Largest Expense</div>
              <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{stats.largestExpense.title}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stats.largestExpense.date} · {memberMap.get(stats.largestExpense.payerId)?.name ?? "?"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: "var(--accent)" }}>
                {baseSymbol}{(stats.largestExpense.totalAmount * stats.largestExpense.exchangeRate).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending by day */}
      {stats.spendingByDay.length > 1 && (
        <div className="card p-4 animate-fadeIn">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Spending by Day</div>
          <div className="flex items-end gap-1 h-32">
            {stats.spendingByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full rounded-t-md gradient-accent transition-all duration-300"
                  style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: "2px", opacity: 0.8 }}
                  title={`${d.date}: ${baseSymbol}${d.total.toFixed(2)}`}
                />
                <div className="text-[8px] truncate w-full text-center" style={{ color: "var(--text-muted)" }}>
                  {d.date.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending by week */}
      {stats.spendingByWeek.length > 1 && (
        <div className="card p-4 animate-fadeIn">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Spending by Week</div>
          <div className="flex items-end gap-2 h-32">
            {stats.spendingByWeek.map((w) => (
              <div key={w.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full rounded-t-md gradient-accent transition-all duration-300"
                  style={{ height: `${(w.total / maxWeek) * 100}%`, minHeight: "2px", opacity: 0.8 }}
                  title={`Week of ${w.date}: ${baseSymbol}${w.total.toFixed(2)}`}
                />
                <div className="text-[8px] truncate w-full text-center" style={{ color: "var(--text-muted)" }}>
                  {w.date.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-member spending */}
      <div className="card p-4 animate-fadeIn">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Spending by Member</div>
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
                      <span style={{ color: "var(--text-primary)" }}>{member?.name ?? "?"}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ms.expenseCount} expenses</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                      {baseSymbol}{ms.totalPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
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
        <div className="card p-4 animate-fadeIn">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>By Category</div>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat, idx) => (
              <div key={cat.category} className="transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span style={{ color: "var(--text-primary)" }}>{getCategoryLabel(cat.category)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.count}x</span>
                    <span className="font-mono tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                      {baseSymbol}{cat.total.toFixed(2)}
                    </span>
                    <span className="text-xs w-10 text-right" style={{ color: "var(--text-muted)" }}>
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
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

      {/* Split type distribution */}
      <div className="card p-4 animate-fadeIn">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Split Types Used</div>
        <div className="grid grid-cols-4 gap-2">
          {(["equal", "exact", "percentage", "shares"] as const).map((st) => {
            const count = stats.splitTypeDistribution[st];
            const pct = stats.expenseCount > 0 ? (count / stats.expenseCount) * 100 : 0;
            return (
              <div key={st} className="text-center row-enter" style={{ animationDelay: `${(["equal", "exact", "percentage", "shares"].indexOf(st)) * 50}ms` }}>
                <div className="text-lg font-bold font-mono" style={{ color: count > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                  {count}
                </div>
                <div className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{st}</div>
                <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full gradient-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currency breakdown */}
      {stats.currencyBreakdown.length > 1 && (
        <div className="card p-4 animate-fadeIn">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>By Currency</div>
          <div className="space-y-2">
            {stats.currencyBreakdown.map((cb, idx) => (
              <div key={cb.currency} className="flex items-center justify-between text-sm py-1 transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms`, borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{cb.currency}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>{cb.count}x</span>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {baseSymbol}{cb.totalConverted.toFixed(2)}
                  </span>
                  {cb.currency !== "HKD" && (
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
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
    <div className="card p-3 rounded-xl animate-fadeIn">
      <div className="text-xs mb-1 truncate" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-base font-bold tabular-nums font-mono" style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
