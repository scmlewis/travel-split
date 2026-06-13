import { useMemo, Fragment } from "react";
import type { Expense, Member } from "../types";
import { formatDateShort } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";
import { PencilIcon, XIcon } from "./Icons";

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

  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
    const groups: Record<string, Expense[]> = {};
    for (const exp of sorted) {
      const d = exp.date || "unknown";
      if (!groups[d]) groups[d] = [];
      groups[d].push(exp);
    }
    return groups;
  }, [expenses]);

  const dateKeys = Object.keys(groupedExpenses);

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-indigo-500 rounded-full" />
        Expense Ledger
      </h2>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fadeIn">
            <div className="text-5xl mb-3">📋</div>
            <div className="text-base font-medium text-slate-600 dark:text-slate-300 mb-1">No expenses yet</div>
            <div className="text-sm text-slate-400 dark:text-slate-500">
              Tap the <span className="text-indigo-500 font-medium">+ Expense</span> button to add your first expense
            </div>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {dateKeys.map((date) => {
              const exps = groupedExpenses[date];
              const dayTotal = exps.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
              return (
                <Fragment key={date}>
                  {/* Day header */}
                  <div className="bg-slate-50/80 dark:bg-slate-700/30 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-[5] border-b border-slate-100 dark:border-slate-700">
                    {date === "unknown" ? "Unknown Date" : formatDateShort(date)}
                    <span className="ml-2 font-normal text-slate-400 dark:text-slate-500 normal-case">
                      {exps.length} expense{exps.length !== 1 ? "s" : ""} · {baseSymbol}{dayTotal.toFixed(2)}
                    </span>
                  </div>
                  {/* Expense cards */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {exps.map((exp, idx) => {
                      const payer = memberMap.get(exp.payerId);
                      const baseAmt = exp.totalAmount * exp.exchangeRate;
                      return (
                        <div
                          key={exp.id}
                          className="px-4 py-3 transition-row row-enter"
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          {/* Top row: title + amounts */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <span className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate block">{exp.title}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums font-mono">
                                {baseSymbol}{baseAmt.toFixed(2)}
                              </div>
                              {exp.currency !== baseSymbol && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                                  {exp.totalAmount.toFixed(2)} {exp.currency}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Bottom row: payer + split + actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {payer && <Avatar name={payer.name} size="sm" />}
                              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {payer?.name ?? "—"} paid
                              </span>
                              <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {exp.shares.length === members.length ? "equal split" : `${exp.shares.length} people`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => onEdit(exp)}
                                className="text-sm px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-medium btn-press min-h-[36px] flex items-center gap-1"
                                title="Edit expense"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  onDelete(exp.id);
                                  addToast(`Deleted "${exp.title}"`, "info");
                                }}
                                className="text-sm px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium btn-press min-h-[36px] flex items-center gap-1"
                                title="Delete expense"
                              >
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
