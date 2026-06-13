import { useState, useMemo, useRef, useEffect } from "react";
import type { AppState, Group, Member, Expense, CurrencyCode, OmitExpenseId } from "./types";
import { CURRENCY_MAP, generateId } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./hooks/useToast";
import { calculateBalances, simplifyDebts } from "./debtSolver";
import TripList from "./components/TripList";
import ThemeToggle from "./components/ThemeToggle";
import SummaryCards from "./components/SummaryCards";
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        {/* Top row: back, name, +Expense, menu */}
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            onClick={handleBackToTrips}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-lg min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            title="Back to trips"
          >
            ←
          </button>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">🧳 {currentTrip.name}</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 dark:bg-indigo-500 text-white text-sm px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors btn-press min-h-[44px]"
            >
              {showForm ? "✕" : "+"}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-xl"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 min-w-[200px] z-50 animate-scaleIn">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Theme</span>
                    <ThemeToggle theme={theme} onChange={setTheme} />
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => { refreshRates(); addToast("Refreshing exchange rates...", "info"); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium min-h-[44px] flex items-center"
                  >
                    ↻ Refresh FX Rates
                  </button>
                  <button
                    onClick={() => { handleExport(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium min-h-[44px] flex items-center"
                  >
                    📤 Export Data
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium min-h-[44px] flex items-center"
                  >
                    📥 Import Data
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => { handleReset(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium min-h-[44px] flex items-center"
                  >
                    🗑️ Reset Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Bottom row: meta info (visible on desktop, hidden on mobile since it's in menu) */}
        <div className="hidden sm:flex px-4 pb-2 items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-mono text-xs">
            {baseCurrency} {sym}
          </span>
          <span>{currentTrip.members.length} members</span>
          {lastUpdated && <span className="text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <aside className="lg:w-[380px] shrink-0 bg-white dark:bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
          <div className="p-3 space-y-3">
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

        <main className="flex-1 min-w-0 p-3 space-y-4">
          <SummaryCards
            expenses={currentTrip.expenses}
            members={currentTrip.members}
            baseSymbol={sym}
          />
          <ExpenseLedger
            expenses={currentTrip.expenses}
            members={currentTrip.members}
            baseSymbol={sym}
            onDelete={handleDeleteExpense}
            onEdit={setEditingExpense}
          />

          <section>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
              Net Balances
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[250px] overflow-y-auto">
                {balances.length === 0 ? (
                  <div className="text-center py-6 text-base text-slate-400 dark:text-slate-500">No data</div>
                ) : (
                  balances.map((b) => {
                    const member = currentTrip.members.find((m) => m.id === b.memberId);
                    return (
                      <div key={b.memberId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{member?.name ?? "?"}</span>
                        <span className={`font-mono tabular-nums font-semibold ${b.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {b.net >= 0 ? "+" : ""}{sym}{b.net.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <SettlementBoard
            members={currentTrip.members}
            settlements={settlements}
            baseSymbol={sym}
            paidSettlements={currentTrip.paidSettlements}
            onTogglePaid={handleTogglePaid}
          />

          <footer className="text-[10px] text-slate-400 dark:text-slate-500 text-center pb-4">
            Data saved to localStorage · Travel Split v2.0
          </footer>
        </main>
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
