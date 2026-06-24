import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { AppState, Group, Member, Expense, CurrencyCode, OmitExpenseId, ExpenseTemplate, SettlementPayment, SplitType } from "./types";
import { CURRENCY_MAP, generateId, DEFAULT_CATEGORY_LIST, todayString } from "./types";
import { useUndoableState } from "./hooks/useUndoableState";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./hooks/useToast";
import { calculateBalances, simplifyDebts } from "./debtSolver";
import { exportCSV, exportPDF } from "./exportUtils";
import TripList from "./components/TripList";
import ThemeToggle from "./components/ThemeToggle";
import { ArrowLeftIcon, XIcon, MoreIcon, RefreshIcon, UploadIcon, DownloadIcon, TrashIcon, SuitcaseIcon, PlusIcon, LayoutDashboardIcon, ListIcon, FileIcon, PencilIcon, UndoIcon, RedoIcon, BarChartIcon, UsersIcon, BookmarkIcon, TargetIcon, SettingsIcon } from "./components/Icons";
import SummaryCards from "./components/SummaryCards";
import MemberPanel from "./components/MemberPanel";
import ExpenseForm from "./components/ExpenseForm";

const isPaidEntry = (val: boolean | SettlementPayment): val is SettlementPayment => typeof val === "object" && val !== null;
import ExpenseLedger from "./components/ExpenseLedger";
import EditExpenseModal from "./components/EditExpenseModal";
import SettlementBoard from "./components/SettlementBoard";
import CategoryManager from "./components/CategoryManager";
import ExpenseStats from "./components/ExpenseStats";
import TemplateManager from "./components/TemplateManager";

function createEmptyGroup(name: string, baseCurrency: CurrencyCode): Group {
  return {
    id: generateId(),
    name,
    members: [],
    expenses: [],
    baseCurrency,
    paidSettlements: {},
  };
}

const INITIAL_STATE: AppState = { trips: [], currentTripId: null };

function computeNextRecurringDate(currentDate: string, frequency: "weekly" | "monthly" | "yearly"): string {
  const d = new Date(currentDate + "T00:00:00");
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

export default function App() {
  const { state: appState, setState: setAppState, undo, redo, canUndo, canRedo, clearHistory } = useUndoableState<AppState>("travel-split-app", INITIAL_STATE);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "stats" | "manage">("overview");
  const [editingTripName, setEditingTripName] = useState(false);
  const [tripNameInput, setTripNameInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const templates = useMemo(() => appState.templates ?? [], [appState.templates]);

  const setTemplates = useCallback((updater: ExpenseTemplate[] | ((prev: ExpenseTemplate[]) => ExpenseTemplate[])) => {
    setAppState((prev) => ({
      ...prev,
      templates: typeof updater === "function" ? updater(prev.templates ?? []) : updater,
    }));
  }, [setAppState]);

  const currentTrip = useMemo(
    () => appState.trips.find((t) => t.id === appState.currentTripId) ?? null,
    [appState.trips, appState.currentTripId],
  );

  const baseCurrency = currentTrip?.baseCurrency ?? "HKD";
  const sym = CURRENCY_MAP[baseCurrency]?.symbol ?? baseCurrency;
  const allCategories = useMemo(
    () => [...DEFAULT_CATEGORY_LIST, ...(currentTrip?.customCategories ?? [])],
    [currentTrip?.customCategories],
  );
  const { rates: exchangeRates, refresh: refreshRates, isStale, timeSinceUpdate } = useExchangeRates(baseCurrency);

  const balances = useMemo(
    () => (currentTrip ? calculateBalances(currentTrip.expenses, currentTrip.members) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTrip?.expenses, currentTrip?.members],
  );
  const settlements = useMemo(
    () => (currentTrip ? simplifyDebts(currentTrip.expenses, currentTrip.members, balances) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTrip?.expenses, currentTrip?.members, balances],
  );

  // Auto-recurring: generate next expense when due
  useEffect(() => {
    if (!currentTrip) return;
    const today = todayString();
    let changed = false;
    const newExpenses: Expense[] = [];
    for (const exp of currentTrip.expenses) {
      if (!exp.recurring?.enabled || !exp.recurring.nextDate) continue;
      if (exp.recurring.nextDate > today) continue;
      const nextDate = computeNextRecurringDate(exp.recurring.nextDate, exp.recurring.frequency);
      newExpenses.push({
        ...exp,
        id: generateId(),
        date: exp.recurring.nextDate,
        createdAt: Date.now(),
        recurring: { ...exp.recurring, nextDate },
        notes: exp.notes ? `${exp.notes} (auto-generated)` : "auto-generated",
      });
      changed = true;
    }
    if (changed && newExpenses.length > 0) {
      setAppState((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => {
          if (t.id !== prev.currentTripId) return t;
          const updatedExpenses = t.expenses.map((e) => {
            if (!e.recurring?.enabled || !e.recurring.nextDate) return e;
            if (e.recurring.nextDate > today) return e;
            const nextDate = computeNextRecurringDate(e.recurring.nextDate, e.recurring.frequency);
            return { ...e, recurring: { ...e.recurring, nextDate } };
          });
          return { ...t, expenses: [...updatedExpenses, ...newExpenses] };
        }),
      }));
    }
  }, [currentTrip, setAppState]);

  const updateTrip = useCallback((updates: Partial<Group>) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, ...updates } : t)),
    }));
  }, [setAppState]);

  const handleCreateTrip = useCallback((name: string, baseCurrency: CurrencyCode) => {
    const trip = createEmptyGroup(name, baseCurrency);
    setAppState((prev) => ({
      trips: [...prev.trips, trip],
      currentTripId: trip.id,
    }));
  }, [setAppState]);

  const handleSelectTrip = useCallback((id: string) => {
    setAppState((prev) => ({ ...prev, currentTripId: id }));
  }, [setAppState]);

  const handleDeleteTrip = useCallback((id: string) => {
    setAppState((prev) => ({
      trips: prev.trips.filter((t) => t.id !== id),
      currentTripId: prev.currentTripId === id ? null : prev.currentTripId,
    }));
  }, [setAppState]);

  const handleBackToTrips = useCallback(() => {
    setAppState((prev) => ({ ...prev, currentTripId: null }));
    setShowForm(false);
  }, [setAppState]);

  const handleRenameTrip = useCallback(() => {
    setTripNameInput((input) => {
      setAppState((prev) => {
        const trip = prev.trips.find((t) => t.id === prev.currentTripId);
        const trimmed = input.trim();
        if (!trimmed || trimmed === trip?.name) return prev;
        return {
          ...prev,
          trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, name: trimmed } : t)),
        };
      });
      return input;
    });
    setEditingTripName(false);
    addToast("Trip renamed", "success");
  }, [setAppState, addToast]);

  const handleAddMember = useCallback((name: string) => {
    setAppState((prev) => {
      const trip = prev.trips.find((t) => t.id === prev.currentTripId);
      if (!trip) return prev;
      if (trip.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) return prev;
      const m: Member = { id: generateId(), name };
      return { ...prev, trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, members: [...t.members, m] } : t)) };
    });
  }, [setAppState]);

  const handleRemoveMember = useCallback((id: string) => {
    setAppState((prev) => {
      const trip = prev.trips.find((t) => t.id === prev.currentTripId);
      if (!trip) return prev;
      return {
        ...prev,
        trips: prev.trips.map((t) => (t.id === prev.currentTripId ? {
          ...t,
          members: t.members.filter((m) => m.id !== id),
          expenses: t.expenses.filter((e) => e.payerId !== id || e.shares.some((s) => s.memberId === id)),
        } : t)),
      };
    });
  }, [setAppState]);

  const handleUpdateMember = useCallback((id: string, updates: Partial<Member>) => {
    setAppState((prev) => {
      return {
        ...prev,
        trips: prev.trips.map((t) => (t.id === prev.currentTripId ? {
          ...t,
          members: t.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        } : t)),
      };
    });
  }, [setAppState]);

  const handleAddExpense = useCallback((data: OmitExpenseId) => {
    setAppState((prev) => {
      const expense: Expense = { ...data, id: generateId() };
      return {
        ...prev,
        trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, expenses: [...t.expenses, expense] } : t)),
      };
    });
  }, [setAppState]);

  const handleDeleteExpense = useCallback((id: string) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, expenses: t.expenses.filter((e) => e.id !== id) } : t)),
    }));
  }, [setAppState]);

  const handleEditExpense = useCallback((updated: Expense) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, expenses: t.expenses.map((e) => (e.id === updated.id ? updated : e)) } : t)),
    }));
    setEditingExpense(null);
  }, [setAppState]);

  const handleTogglePaid = useCallback((from: string, to: string, note?: string) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => {
        if (t.id !== prev.currentTripId) return t;
        const key = `${from}|${to}`;
        const next = { ...t.paidSettlements } as Record<string, boolean | SettlementPayment>;
        if (next[key]) {
          delete next[key];
        } else {
          const existingEntry = next[key];
          const history = isPaidEntry(existingEntry) ? existingEntry.history : [];
          next[key] = {
            paid: true,
            paidDate: note || new Date().toISOString().split("T")[0],
            history: [...history, { date: note || new Date().toISOString().split("T")[0], amount: 0 }],
          };
        }
        return { ...t, paidSettlements: next };
      }),
    }));
  }, [setAppState]);

  const handleSetBudget = useCallback((budget: number | undefined) => {
    updateTrip({ budget });
  }, [updateTrip]);

  const handleApplyTemplate = useCallback((template: ExpenseTemplate) => {
    const expense: OmitExpenseId = {
      title: template.title,
      totalAmount: template.totalAmount,
      currency: template.currency,
      exchangeRate: 1,
      payerId: currentTrip?.members[0]?.id ?? "",
      shares: (currentTrip?.members ?? []).map((m) => ({
        memberId: m.id,
        amount: template.totalAmount / (currentTrip?.members.length || 1),
        splitType: template.splitType as SplitType,
      })),
      createdAt: Date.now(),
      date: todayString(),
      categories: template.categories,
      notes: template.notes,
    };
    handleAddExpense(expense);
    addToast(`Applied template "${template.name}"`);
  }, [currentTrip, handleAddExpense, addToast]);

  const handleReset = useCallback(() => {
    setAppState((prev) => {
      const trip = prev.trips.find((t) => t.id === prev.currentTripId);
      if (!trip) return prev;
      const confirmed = window.confirm(
        `Are you sure you want to delete all data in "${trip.name}"?\n\nThis action cannot be undone and will delete all expenses, members, settlements, and payment history for this trip.`
      );
      if (!confirmed) return prev;
      return {
        trips: prev.trips.filter((t) => t.id !== prev.currentTripId),
        currentTripId: null,
      };
    });
    clearHistory();
  }, [setAppState, clearHistory]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripsplit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    addToast("Data exported");
  }, [appState, addToast]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as AppState;
        if (data.trips && Array.isArray(data.trips)) {
          const invalidTrips = data.trips.filter((trip) => {
            if (!trip.id || typeof trip.id !== "string") return true;
            if (!trip.name || typeof trip.name !== "string") return true;
            if (!trip.members || !Array.isArray(trip.members)) return true;
            if (!trip.expenses || !Array.isArray(trip.expenses)) return true;
            if (trip.members.some((m) => !m.id || typeof m.name !== "string")) return true;
            return false;
          });

          if (invalidTrips.length > 0) {
            addToast(`Import failed: Invalid data structure in ${invalidTrips.length} trip(s)`, "error");
            return;
          }

          const allMemberNames = new Set<string>();

          data.trips.forEach((trip) => {
            trip.members.forEach((member) => {
              const normalizedName = member.name.toLowerCase().trim();
              if (allMemberNames.has(normalizedName)) {
                addToast(`Import warning: Duplicate member "${member.name}" in trip "${trip.name}" will be ignored`, "info");
              } else {
                allMemberNames.add(normalizedName);
              }
            });
          });

          if (window.confirm("This will replace all current data. Continue?")) {
            setAppState(data);
            clearHistory();
            addToast("Data imported successfully");
          }
        } else {
          addToast("Invalid file format", "error");
        }
      } catch {
        addToast("Could not parse JSON file", "error");
      }
    };
    reader.readAsText(file);
  }, [setAppState, addToast, clearHistory]);

  const handleUpdateCategories = useCallback((cats: string[]) => {
    updateTrip({ customCategories: cats });
  }, [updateTrip]);

  const handleCloseEditModal = useCallback(() => setEditingExpense(null), []);

  const handleCloseMenuExportCSV = useCallback(() => {
    if (currentTrip) {
      exportCSV(currentTrip.expenses, currentTrip.members, settlements, sym, currentTrip.name);
      addToast("CSV exported");
    }
    setShowMenu(false);
  }, [currentTrip, settlements, sym, addToast]);

  const handleCloseMenuExportSummary = useCallback(() => {
    if (currentTrip) {
      exportPDF(currentTrip.expenses, currentTrip.members, settlements, sym, currentTrip.name);
      addToast("Summary exported");
    }
    setShowMenu(false);
  }, [currentTrip, settlements, sym, addToast]);

  if (!currentTrip) {
    return (
      <>
        <TripList
          trips={appState.trips}
          onSelect={handleSelectTrip}
          onCreate={handleCreateTrip}
          onDelete={handleDeleteTrip}
          theme={theme}
          onThemeChange={setTheme}
        />
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <header
          className="sticky top-0 z-30 transition-shadow duration-200"
          style={{
            background: "var(--md-sys-color-surface)",
            borderBottom: "1px solid var(--md-sys-color-outline-variant)",
            boxShadow: headerScrolled ? "var(--md-sys-elevation-1)" : "none",
          }}
        >
        {/* Top row: back, name, +Expense, menu */}
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            onClick={handleBackToTrips}
            className="hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            title="Back to trips"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          {editingTripName ? (
            <input
              className="flex-1 min-w-0 text-lg sm:text-xl font-bold rounded-lg px-2 py-1 min-h-[44px]"
              style={{ background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }}
              value={tripNameInput}
              onChange={(e) => setTripNameInput(e.target.value)}
              onBlur={handleRenameTrip}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameTrip(); if (e.key === "Escape") setEditingTripName(false); }}
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setTripNameInput(currentTrip.name); setEditingTripName(true); }}
              className="text-lg sm:text-xl font-bold truncate flex items-center gap-1.5 hover:opacity-70 transition-opacity min-h-[44px]"
              style={{ color: "var(--md-sys-color-on-surface)" }}
              title="Click to rename trip"
            >
              <SuitcaseIcon className="w-5 h-5 shrink-0" />
              {currentTrip.name}
              <PencilIcon className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <UndoIcon className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <RedoIcon className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="gradient-accent text-sm px-3 sm:px-4 py-2 rounded-lg font-semibold btn-press min-h-[44px]"
              aria-label={showForm ? "Close expense form" : "Add expense"}
            >
              {showForm ? <XIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                aria-label="Menu"
              >
                <MoreIcon className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 card-elevated rounded-xl py-2 min-w-[200px] z-50 animate-scaleIn shadow-xl">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Theme</span>
                    <ThemeToggle theme={theme} onChange={setTheme} />
                  </div>
                  <div className="my-1" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }} />
                  <button
                    onClick={() => { refreshRates(); addToast("Refreshing exchange rates...", "info"); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    <RefreshIcon className="w-4 h-4" />
                    Refresh FX Rates
                    {isStale && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                        Stale{timeSinceUpdate ? ` ${timeSinceUpdate}` : ""}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { handleExport(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    <UploadIcon className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleCloseMenuExportCSV}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    <FileIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleCloseMenuExportSummary}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Export Summary
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Import Data
                  </button>
                  <div className="my-1" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }} />
                  <button
                    onClick={() => { handleReset(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Reset Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="p-5 pb-24 space-y-5 relative z-20" role="tabpanel">
            {showForm && (
              <div className="card-elevated p-4 animate-fadeIn">
                <ExpenseForm
                  members={currentTrip.members}
                  baseSymbol={sym}
                  exchangeRates={exchangeRates}
                  allCategories={allCategories}
                  onAdd={handleAddExpense}
                  recentExpenses={currentTrip.expenses}
                />
              </div>
            )}
            {activeTab === "overview" ? (
              <>
                <SummaryCards
                  expenses={currentTrip.expenses}
                  memberCount={currentTrip.members.length}
                  baseSymbol={sym}
                  budget={currentTrip.budget}
                  baseCurrency={baseCurrency}
                />
                <SettlementBoard
                  members={currentTrip.members}
                  settlements={settlements}
                  baseSymbol={sym}
                  paidSettlements={currentTrip.paidSettlements as Record<string, boolean | SettlementPayment>}
                  onTogglePaid={handleTogglePaid}
                />
              </>
            ) : activeTab === "expenses" ? (
              <ExpenseLedger
                expenses={currentTrip.expenses}
                members={currentTrip.members}
                baseSymbol={sym}
                allCategories={allCategories}
                onDelete={handleDeleteExpense}
                onEdit={setEditingExpense}
              />
            ) : activeTab === "stats" ? (
              <ExpenseStats
                expenses={currentTrip.expenses}
                members={currentTrip.members}
                baseSymbol={sym}
              />
            ) : (
              <div className="space-y-4">
                <div className="card-elevated p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    <UsersIcon className="w-4 h-4" style={{ color: "var(--md-sys-color-primary)" }} />
                    Members
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}>{currentTrip.members.length}</span>
                  </h3>
                  <MemberPanel
                    members={currentTrip.members}
                    onAdd={handleAddMember}
                    onRemove={handleRemoveMember}
                    onUpdateMember={handleUpdateMember}
                  />
                </div>
                <div className="card-elevated p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    <BookmarkIcon className="w-4 h-4" style={{ color: "var(--md-sys-color-primary)" }} />
                    Categories
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}>{allCategories.length}</span>
                  </h3>
                  <CategoryManager
                    customCategories={currentTrip.customCategories ?? []}
                    onUpdate={handleUpdateCategories}
                  />
                </div>
                {(() => {
                  const totalSpent = currentTrip.expenses.reduce((sum, e) => sum + e.totalAmount * e.exchangeRate, 0);
                  const hasBudget = currentTrip.budget != null && currentTrip.budget > 0;
                  return (
                    <div className="card-elevated p-4">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                        <TargetIcon className="w-4 h-4" style={{ color: "var(--md-sys-color-primary)" }} />
                        Budget
                        {hasBudget && (
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-primary)" }}>{sym}{currentTrip.budget!.toFixed(0)}</span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {hasBudget ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-mono font-bold tabular-nums" style={{ color: "var(--md-sys-color-primary)" }}>
                                {sym}{totalSpent.toFixed(2)} / {sym}{currentTrip.budget!.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleSetBudget(undefined)}
                                className="text-xs px-2.5 py-1.5 rounded-lg"
                                style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}
                                aria-label="Remove budget"
                              >
                                Clear
                              </button>
                            </div>
                            <div className={`md-linear-progress ${totalSpent > currentTrip.budget! ? "md-linear-progress-error" : ""}`}>
                              <div className="md-linear-progress-fill" style={{ width: `${Math.min((totalSpent / currentTrip.budget!) * 100, 100)}%` }} />
                            </div>
                            <div className="text-[10px] font-medium font-mono text-right" style={{ color: totalSpent > currentTrip.budget! ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)" }}>
                              {totalSpent > currentTrip.budget! ? `Over by ${sym}${(totalSpent - currentTrip.budget!).toFixed(2)}` : `${sym}${(currentTrip.budget! - totalSpent).toFixed(2)} remaining`}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[36px] font-mono"
                              placeholder={`Set budget in ${baseCurrency}`}
                              id="budget-input-manage"
                              aria-label="Set trip budget"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById("budget-input-manage") as HTMLInputElement;
                                const val = parseFloat(input?.value);
                                if (val > 0) {
                                  handleSetBudget(val);
                                  input.value = "";
                                }
                              }}
                              className="gradient-accent text-sm px-3 py-2 rounded-lg font-semibold min-h-[36px] btn-press"
                              aria-label="Save budget"
                            >
                              Set
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="card-elevated p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    <BookmarkIcon className="w-4 h-4" style={{ color: "var(--md-sys-color-primary)" }} />
                    Templates
                    {templates.length > 0 && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}>{templates.length}</span>
                    )}
                  </h3>
                  <TemplateManager
                    templates={templates}
                    onUpdate={setTemplates}
                    onApply={handleApplyTemplate}
                    baseCurrency={baseCurrency}
                    memberCount={currentTrip.members.length}
                  />
                </div>
              </div>
            )}

            <footer className="text-[10px] text-center py-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              Data saved to localStorage · Travel Split v2.0 ·{" "}
              <a href="https://github.com/scmlewis/travel-split" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity" style={{ color: "var(--md-sys-color-primary)" }}>Source</a>
              {" "}· Built by{" "}
              <a href="https://github.com/scmlewis" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity" style={{ color: "var(--md-sys-color-primary)" }}>scmlewis</a>
            </footer>
          </div>
        </main>

      <div className="fixed left-1/2 -translate-x-1/2 z-40" style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "var(--md-sys-color-surface-container)", border: "1px solid var(--md-sys-color-outline-variant)" }}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "overview" ? "tab-active" : "tab-inactive"}`}
            role="tab"
            aria-selected={activeTab === "overview"}
            aria-label="Overview tab"
          >
            <LayoutDashboardIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "expenses" ? "tab-active" : "tab-inactive"}`}
            role="tab"
            aria-selected={activeTab === "expenses"}
            aria-label="Expenses tab"
          >
            <ListIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "stats" ? "tab-active" : "tab-inactive"}`}
            role="tab"
            aria-selected={activeTab === "stats"}
            aria-label="Stats tab"
          >
            <BarChartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "manage" ? "tab-active" : "tab-inactive"}`}
            role="tab"
            aria-selected={activeTab === "manage"}
            aria-label="Manage tab"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>
      </div>

      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />

      {editingExpense && (
        <EditExpenseModal
          key={editingExpense.id}
          expense={editingExpense}
          members={currentTrip.members}
          baseSymbol={sym}
          allCategories={allCategories}
          onSave={handleEditExpense}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
    </div>
  );
}
