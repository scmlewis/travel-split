import { useMemo, useState, Fragment } from "react";
import type { Expense, Member } from "../types";
import { getCategoryLabel, formatDateShort } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";
import { PencilIcon, XIcon, ClipboardIcon, SearchIcon, FilterIcon, CheckSquareIcon, CheckIcon } from "./Icons";

interface ExpenseLedgerProps {
  expenses: Expense[];
  members: Member[];
  baseSymbol: string;
  allCategories: string[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export default function ExpenseLedger({ expenses, members, baseSymbol, allCategories, onDelete, onEdit }: ExpenseLedgerProps) {
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPayer, setFilterPayer] = useState<string>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) => {
        if (e.title.toLowerCase().includes(q)) return true;
        if (e.notes?.toLowerCase().includes(q)) return true;
        const payer = memberMap.get(e.payerId);
        if (payer?.name.toLowerCase().includes(q)) return true;
        if (e.categories?.some((c) => c.toLowerCase().includes(q) || getCategoryLabel(c).toLowerCase().includes(q))) return true;
        if (e.items?.some((item) => item.title.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((e) => e.categories?.includes(filterCategory));
    }
    if (filterPayer !== "all") {
      filtered = filtered.filter((e) => e.payerId === filterPayer);
    }
    return filtered;
  }, [expenses, search, filterCategory, filterPayer, memberMap]);

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
  const hasFilters = search.trim() || filterCategory !== "all" || filterPayer !== "all";

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} expense(s)?`)) return;
    selectedIds.forEach((id) => onDelete(id));
    addToast(`Deleted ${selectedIds.size} expense(s)`, "info");
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Expense Ledger
      </h2>

      {expenses.length > 0 && (
        <div className="card p-3 mb-3 space-y-2">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm min-h-[44px]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." aria-label="Search expenses" />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all min-h-[28px] flex items-center gap-1 ${selectMode ? "gradient-accent text-white font-semibold" : ""}`}
              style={!selectMode ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}
              aria-label={selectMode ? "Cancel selection" : "Select expenses"}
            >
              <CheckSquareIcon className="w-3.5 h-3.5" />
              {selectMode ? "Cancel" : "Select"}
            </button>
            {selectMode && selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold min-h-[28px]"
                style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
                aria-label={`Delete ${selectedIds.size} selected expenses`}
              >
                Delete ({selectedIds.size})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <FilterIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <button onClick={() => setFilterCategory("all")}
              className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === "all" && filterPayer === "all" ? "gradient-accent text-white font-semibold" : ""}`}
              style={!(filterCategory === "all" && filterPayer === "all") ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}
              aria-label="Show all expenses">
              All
            </button>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === cat ? "gradient-accent text-white font-semibold" : ""}`}
                style={filterCategory !== cat ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}
                aria-label={`Filter by ${getCategoryLabel(cat)}`}>
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>Paid by:</span>
            {members.map((m) => (
              <button key={m.id} onClick={() => setFilterPayer(filterPayer === m.id ? "all" : m.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterPayer === m.id ? "gradient-accent text-white font-semibold" : ""}`}
                style={filterPayer !== m.id ? { background: "var(--border)", color: "var(--text-secondary)" } : undefined}
                aria-label={`Filter paid by ${m.name}`}>
                {m.name}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterCategory("all"); setFilterPayer("all"); }}
              className="text-xs font-medium w-full py-1 rounded-lg" style={{ color: "var(--accent)" }}
              aria-label="Clear all filters">
              Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
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
                      const cats = exp.categories || [];
                      return (
                        <div key={exp.id} className="px-4 py-3 transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms`, borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{exp.title}</span>
                                {cats.map((cat) => (
                                  <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                                    {getCategoryLabel(cat)}
                                  </span>
                                ))}
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
                              {selectMode ? (
                                <button
                                  onClick={() => toggleSelect(exp.id)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedIds.has(exp.id) ? "gradient-accent text-white" : ""}`}
                                  style={!selectedIds.has(exp.id) ? { background: "var(--border)" } : undefined}
                                  aria-label={`Select ${exp.title}`}
                                >
                                  {selectedIds.has(exp.id) && <CheckIcon className="w-4 h-4" />}
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => onEdit(exp)} className="text-sm px-3 py-1.5 rounded-lg transition-opacity font-medium btn-press min-h-[36px] flex items-center gap-1" style={{ background: "var(--border)", color: "var(--accent)" }} title="Edit expense" aria-label={`Edit ${exp.title}`}>
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => { onDelete(exp.id); addToast(`Deleted "${exp.title}"`, "info"); }}
                                    className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:text-red-400 transition-opacity font-medium btn-press min-h-[36px] flex items-center gap-1" style={{ background: "var(--border)" }} title="Delete expense" aria-label={`Delete ${exp.title}`}>
                                    <XIcon className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
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
