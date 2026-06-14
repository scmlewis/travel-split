import { useState, useMemo, useRef, useEffect } from "react";
import type { AppState, Group, Member, Expense, CurrencyCode, OmitExpenseId } from "./types";
import { CURRENCY_MAP, generateId } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./hooks/useToast";
import { calculateBalances, simplifyDebts } from "./debtSolver";
import { exportCSV, exportPDF } from "./exportUtils";
import TripList from "./components/TripList";
import ThemeToggle from "./components/ThemeToggle";
import { ArrowLeftIcon, XIcon, MoreIcon, RefreshIcon, UploadIcon, DownloadIcon, TrashIcon, SuitcaseIcon, PlusIcon, LayoutDashboardIcon, ListIcon, FileIcon } from "./components/Icons";
import SummaryCards from "./components/SummaryCards";
import MemberBalances from "./components/MemberBalances";
import MemberPanel from "./components/MemberPanel";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseLedger from "./components/ExpenseLedger";
import EditExpenseModal from "./components/EditExpenseModal";
import SettlementBoard from "./components/SettlementBoard";

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

export default function App() {
  const [appState, setAppState] = useLocalStorage<AppState>("travel-split-app", INITIAL_STATE);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses">("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const currentTrip = useMemo(
    () => appState.trips.find((t) => t.id === appState.currentTripId) ?? null,
    [appState.trips, appState.currentTripId],
  );

  const baseCurrency = currentTrip?.baseCurrency ?? "HKD";
  const sym = CURRENCY_MAP[baseCurrency]?.symbol ?? baseCurrency;
  const { rates: exchangeRates, refresh: refreshRates, lastUpdated } = useExchangeRates(baseCurrency);

  const balances = useMemo(
    () => (currentTrip ? calculateBalances(currentTrip.expenses, currentTrip.members) : []),
    [currentTrip],
  );
  const settlements = useMemo(
    () => (currentTrip ? simplifyDebts(currentTrip.expenses, currentTrip.members) : []),
    [currentTrip],
  );

  const updateTrip = (updates: Partial<Group>) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === prev.currentTripId ? { ...t, ...updates } : t)),
    }));
  };

  const handleCreateTrip = (name: string, baseCurrency: CurrencyCode) => {
    const trip = createEmptyGroup(name, baseCurrency);
    setAppState((prev) => ({
      trips: [...prev.trips, trip],
      currentTripId: trip.id,
    }));
  };

  const handleSelectTrip = (id: string) => {
    setAppState((prev) => ({ ...prev, currentTripId: id }));
  };

  const handleDeleteTrip = (id: string) => {
    setAppState((prev) => ({
      trips: prev.trips.filter((t) => t.id !== id),
      currentTripId: prev.currentTripId === id ? null : prev.currentTripId,
    }));
  };

  const handleBackToTrips = () => {
    setAppState((prev) => ({ ...prev, currentTripId: null }));
    setShowForm(false);
  };

  const handleAddMember = (name: string) => {
    if (!currentTrip) return;
    if (currentTrip.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) return;
    const m: Member = { id: generateId(), name };
    updateTrip({ members: [...currentTrip.members, m] });
  };

  const handleRemoveMember = (id: string) => {
    if (!currentTrip) return;
    updateTrip({
      members: currentTrip.members.filter((m) => m.id !== id),
      expenses: currentTrip.expenses.filter(
        (e) => e.payerId !== id || e.shares.some((s) => s.memberId === id),
      ),
    });
  };

  const handleAddExpense = (data: OmitExpenseId) => {
    if (!currentTrip) return;
    const expense: Expense = { ...data, id: generateId() };
    updateTrip({ expenses: [...currentTrip.expenses, expense] });
  };

  const handleDeleteExpense = (id: string) => {
    if (!currentTrip) return;
    updateTrip({ expenses: currentTrip.expenses.filter((e) => e.id !== id) });
  };

  const handleEditExpense = (updated: Expense) => {
    if (!currentTrip) return;
    updateTrip({
      expenses: currentTrip.expenses.map((e) => (e.id === updated.id ? updated : e)),
    });
    setEditingExpense(null);
  };

  const handleTogglePaid = (from: string, to: string) => {
    if (!currentTrip) return;
    const key = `${from}|${to}`;
    const next = { ...currentTrip.paidSettlements };
    if (next[key]) delete next[key];
    else next[key] = true;
    updateTrip({ paidSettlements: next });
  };

  const handleReset = () => {
    if (!currentTrip) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete all data in "${currentTrip.name}"?\n\nThis action cannot be undone and will delete all expenses, members, settlements, and payment history for this trip.`
    );
    if (!confirmed) return;
    handleDeleteTrip(currentTrip.id);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripsplit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Data exported");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as AppState;
        if (data.trips && Array.isArray(data.trips)) {
          // Validate imported data structure
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
          
          // Check for duplicate member names across all trips
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
  };

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
    <div className="min-h-screen relative mx-auto max-w-7xl" style={{ background: "var(--surface-gradient)" }}>
      <header className="glass-elevated sticky top-0 z-30" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        {/* Top row: back, name, +Expense, menu */}
        <div className="px-5 py-4 flex items-center gap-2">
          <button
            onClick={handleBackToTrips}
            className="hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            style={{ color: "var(--text-muted)" }}
            title="Back to trips"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-lg sm:text-xl font-bold truncate flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <SuitcaseIcon className="w-5 h-5 shrink-0" />
            {currentTrip.name}
          </span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className="gradient-accent text-white text-sm px-3 sm:px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity btn-press min-h-[44px]"
            >
              {showForm ? <XIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <MoreIcon className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 glass-elevated rounded-xl py-2 min-w-[200px] z-50 animate-scaleIn shadow-xl">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Theme</span>
                    <ThemeToggle theme={theme} onChange={setTheme} />
                  </div>
                  <div className="my-1" style={{ borderTop: "1px solid var(--border)" }} />
                  <button
                    onClick={() => { refreshRates(); addToast("Refreshing exchange rates...", "info"); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <RefreshIcon className="w-4 h-4" />
                    Refresh FX Rates
                  </button>
                  <button
                    onClick={() => { handleExport(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <UploadIcon className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => {
                      if (currentTrip) {
                        exportCSV(currentTrip.expenses, currentTrip.members, settlements, sym, currentTrip.name);
                        addToast("CSV exported");
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <FileIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      if (currentTrip) {
                        exportPDF(currentTrip.expenses, currentTrip.members, settlements, sym, currentTrip.name);
                        addToast("Summary exported");
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Export Summary
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity font-medium min-h-[44px] flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Import Data
                  </button>
                  <div className="my-1" style={{ borderTop: "1px solid var(--border)" }} />
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
        {/* Bottom row: meta info */}
        <div className="hidden sm:flex px-5 pb-3 items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <span className="px-2.5 py-1 rounded-full font-mono text-xs" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
            {baseCurrency} {sym}
          </span>
          <span>{currentTrip.members.length} members</span>
          {lastUpdated && <span className="text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <aside className="lg:w-[380px] shrink-0 glass-card" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }}>
          <div className="p-5 space-y-4">
            <MemberPanel
              members={currentTrip.members}
              onAdd={handleAddMember}
              onRemove={handleRemoveMember}
            />
            {showForm && (
              <ExpenseForm
                members={currentTrip.members}
                baseSymbol={sym}
                exchangeRates={exchangeRates}
                onAdd={handleAddExpense}
              />
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 relative overflow-hidden" style={{ background: "var(--surface-gradient)" }}>
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-float" style={{ background: "var(--accent)" }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl animate-float-delayed" style={{ background: "var(--accent)" }} />
          <div className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full opacity-5 blur-2xl animate-float" style={{ background: "var(--accent)" }} />

          <div className="p-6 pb-24 space-y-6 relative z-20">
            {activeTab === "overview" ? (
              <>
                <SummaryCards
                  expenses={currentTrip.expenses}
                  members={currentTrip.members}
                  baseSymbol={sym}
                />
                <MemberBalances
                  balances={balances}
                  members={currentTrip.members}
                  baseSymbol={sym}
                  settlements={settlements}
                />
                <SettlementBoard
                  members={currentTrip.members}
                  settlements={settlements}
                  baseSymbol={sym}
                  paidSettlements={currentTrip.paidSettlements}
                  onTogglePaid={handleTogglePaid}
                />
              </>
            ) : (
              <ExpenseLedger
                expenses={currentTrip.expenses}
                members={currentTrip.members}
                baseSymbol={sym}
                onDelete={handleDeleteExpense}
                onEdit={setEditingExpense}
              />
            )}

            <footer className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              Data saved to localStorage · Travel Split v2.0
            </footer>
          </div>
        </main>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex gap-1 glass-elevated rounded-2xl p-1.5 shadow-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "overview" ? "tab-active" : "tab-inactive"}`}
          >
            <LayoutDashboardIcon className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${activeTab === "expenses" ? "tab-active" : "tab-inactive"}`}
          >
            <ListIcon className="w-4 h-4" />
            Expenses
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
          expense={editingExpense}
          members={currentTrip.members}
          baseSymbol={sym}
          exchangeRates={exchangeRates}
          onSave={handleEditExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
