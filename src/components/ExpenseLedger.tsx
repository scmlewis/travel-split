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
      <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Expenses
      </h2>

      {expenses.length > 0 && (
        <div className="card-elevated p-3 mb-3 space-y-2">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
            <input className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm min-h-[44px]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." aria-label="Search expenses" />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all min-h-[28px] flex items-center gap-1 ${selectMode ? "gradient-accent font-semibold" : ""}`}
              style={!selectMode ? { background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" } : undefined}
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
            <FilterIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
            <button onClick={() => setFilterCategory("all")}
              className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === "all" && filterPayer === "all" ? "gradient-accent font-semibold" : ""}`}
              style={!(filterCategory === "all" && filterPayer === "all") ? { background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" } : undefined}
              aria-label="Show all expenses">
              All
            </button>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterCategory === cat ? "gradient-accent font-semibold" : ""}`}
                style={filterCategory !== cat ? { background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" } : undefined}
                aria-label={`Filter by ${getCategoryLabel(cat)}`}>
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] shrink-0" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Paid by:</span>
            {members.map((m) => (
              <button key={m.id} onClick={() => setFilterPayer(filterPayer === m.id ? "all" : m.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all min-h-[28px] ${filterPayer === m.id ? "gradient-accent font-semibold" : ""}`}
                style={filterPayer !== m.id ? { background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" } : undefined}
                aria-label={`Filter paid by ${m.name}`}>
                {m.name}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterCategory("all"); setFilterPayer("all"); }}
              className="text-xs font-medium w-full py-1 rounded-lg" style={{ color: "var(--md-sys-color-primary)" }}
              aria-label="Clear all filters">
              Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="card-elevated overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fadeIn">
            <div className="flex justify-center mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              <ClipboardIcon className="w-12 h-12" />
            </div>
            <div className="text-base font-medium mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>No expenses yet</div>
            <div className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              Tap the <span style={{ color: "var(--md-sys-color-primary)" }} className="font-medium">+ Expense</span> button to add your first expense
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4 animate-fadeIn">
            <div className="text-base font-medium mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>No matches</div>
            <div className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Try a different search or filter</div>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {dateKeys.map((date) => {
              const exps = groupedExpenses[date];
              const dayTotal = exps.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
              return (
                <Fragment key={date}>
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-[5] flex items-center justify-between" style={{ background: "var(--md-sys-color-surface-container)", color: "var(--md-sys-color-on-surface-variant)", borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
                    <span>{date === "unknown" ? "Unknown Date" : formatDateShort(date)}</span>
                    <span className="font-mono font-normal normal-case">
                      {baseSymbol}{dayTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
                    {exps.map((exp, idx) => {
                      const payer = memberMap.get(exp.payerId);
                      const baseAmt = exp.totalAmount * exp.exchangeRate;
                      const cats = exp.categories || [];
                      return (
                        <div key={exp.id} className="px-4 py-2.5 transition-row row-enter" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms`, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold truncate" style={{ color: "var(--md-sys-color-on-surface)" }}>{exp.title}</span>
                                {cats.map((cat) => (
                                  <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}>
                                    {getCategoryLabel(cat)}
                                  </span>
                                ))}
                                {exp.recurring?.enabled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}>
                                    {exp.recurring.frequency}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                {payer && <Avatar name={payer.name} size="sm" />}
                                <span className="text-xs truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                                  {payer?.name ?? "—"} paid
                                </span>
                                <span className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>·</span>
                                <span className="text-xs truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                                  {exp.items && exp.items.length > 0 ? `${exp.items.length} items` : exp.shares.length === members.length ? "equal split" : `${exp.shares.length} people`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-bold tabular-nums font-mono" style={{ color: "var(--text-primary)" }}>
                                  {baseSymbol}{baseAmt.toFixed(2)}
                                </div>
                                {exp.currency !== baseSymbol && (
                                  <div className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                                    {exp.totalAmount.toFixed(2)} {exp.currency}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {selectMode ? (
                                  <button
                                    onClick={() => toggleSelect(exp.id)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${selectedIds.has(exp.id) ? "gradient-accent" : ""}`}
                                    style={!selectedIds.has(exp.id) ? { background: "var(--border)" } : undefined}
                                    aria-label={`Select ${exp.title}`}
                                  >
                                    {selectedIds.has(exp.id) && <CheckIcon className="w-4 h-4" />}
                                  </button>
                                ) : (
                                  <>
                                    <button onClick={() => onEdit(exp)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity btn-press" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-primary)" }} title="Edit expense" aria-label={`Edit ${exp.title}`}>
                                      <PencilIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { onDelete(exp.id); addToast(`Deleted "${exp.title}"`, "info"); }}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 transition-opacity btn-press" style={{ background: "var(--md-sys-color-surface-container-high)" }} title="Delete expense" aria-label={`Delete ${exp.title}`}>
                                      <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
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
