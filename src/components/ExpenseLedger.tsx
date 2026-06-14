import { useMemo, useState, Fragment } from "react";
import type { Expense, Member, ExpenseCategory } from "../types";
import { EXPENSE_CATEGORIES, formatDateShort } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";
import { PencilIcon, XIcon, ClipboardIcon, SearchIcon, FilterIcon } from "./Icons";

interface ExpenseLedgerProps {
  expenses: Expense[];
  members: Member[];
  baseSymbol: string;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export default function ExpenseLedger({ expenses, members, baseSymbol, onDelete, onEdit }: ExpenseLedgerProps) {
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">("all");

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || (e.notes?.toLowerCase().includes(q)));
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((e) => e.category === filterCategory);
    }
    return filtered;
  }, [expenses, search, filterCategory]);

  const groupedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => b.createdAt - a.createdAt);
    const groups: Record<string, Expense[]> = {};
    for (const exp of sorted) {
      const d = exp.date || "unknown";
      if (!groups[d]) groups[d] = [];
      groups[d].push(exp);
    }
    return groups;
  }, [filteredExpenses]);

  const dateKeys = Object.keys(groupedExpenses);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Expense Ledger
      </h2>

      {expenses.length > 0 && (
        <div className="glass-card p-3 mb-3 space-y-2">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm min-h-[44px]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <FilterIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <button onClick={() => setFilterCategory("all")}
              className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === "all" ? "gradient-accent text-white font-semibold" : ""}`}
              style={filterCategory !== "all" ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}>
              All
            </button>
            {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, { label: string; emoji: string }][]).map(([key, info]) => (
              <button key={key} onClick={() => setFilterCategory(key)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === key ? "gradient-accent text-white font-semibold" : ""}`}
                style={filterCategory !== key ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}>
                {info.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fadeIn">
            <div className="flex justify-center mb-3" style={{ color: "var(--text-muted)" }}>
              <ClipboardIcon className="w-12 h-12" />
            </div>
            <div className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No expenses yet</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              Tap the <span style={{ color: "var(--accent)" }} className="font-medium">+ Expense</span> button to add your first expense
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4 animate-fadeIn">
            <div className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No matches</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Try a different search or filter</div>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {dateKeys.map((date) => {
              const exps = groupedExpenses[date];
              const dayTotal = exps.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
              return (
                <Fragment key={date}>
                  <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider sticky top-0 z-[5]" style={{ background: "var(--surface-elevated)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    {date === "unknown" ? "Unknown Date" : formatDateShort(date)}
                    <span className="ml-2 font-normal normal-case">
                      {exps.length} expense{exps.length !== 1 ? "s" : ""} · {baseSymbol}{dayTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ borderColor: "var(--border)" }}>
                    {exps.map((exp, idx) => {
                      const payer = memberMap.get(exp.payerId);
                      const baseAmt = exp.totalAmount * exp.exchangeRate;
                      const cat = exp.category ? EXPENSE_CATEGORIES[exp.category] : null;
                      return (
                        <div key={exp.id} className="px-4 py-3 transition-row row-enter" style={{ animationDelay: `${idx * 30}ms`, borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{exp.title}</span>
                                {cat && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                                    {cat.label}
                                  </span>
                                )}
                                {exp.recurring?.enabled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--border)", color: "var(--accent)" }}>
                                    {exp.recurring.frequency}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-base font-bold tabular-nums font-mono" style={{ color: "var(--text-primary)" }}>
                                {baseSymbol}{baseAmt.toFixed(2)}
                              </div>
                              {exp.currency !== baseSymbol && (
                                <div className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                                  {exp.totalAmount.toFixed(2)} {exp.currency}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {payer && <Avatar name={payer.name} size="sm" />}
                              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                                {payer?.name ?? "—"} paid
                              </span>
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
                              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                {exp.items && exp.items.length > 0 ? `${exp.items.length} items` : exp.shares.length === members.length ? "equal split" : `${exp.shares.length} people`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => onEdit(exp)} className="text-sm px-3 py-1.5 rounded-lg transition-opacity font-medium btn-press min-h-[36px] flex items-center gap-1" style={{ background: "var(--border)", color: "var(--accent)" }} title="Edit expense">
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { onDelete(exp.id); addToast(`Deleted "${exp.title}"`, "info"); }}
                                className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:text-red-400 transition-opacity font-medium btn-press min-h-[36px] flex items-center gap-1" style={{ background: "var(--border)" }} title="Delete expense">
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
