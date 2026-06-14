import { useState } from "react";
import type { Group, CurrencyCode } from "../types";
import { CURRENCY_MAP } from "../types";
import ThemeToggle from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { XIcon, GlobeIcon, SuitcaseIcon } from "./Icons";

interface TripListProps {
  trips: Group[];
  onSelect: (id: string) => void;
  onCreate: (name: string, baseCurrency: CurrencyCode) => void;
  onDelete: (id: string) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

export default function TripList({ trips, onSelect, onCreate, onDelete, theme, onThemeChange }: TripListProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("HKD");
  const { addToast } = useToast();

  const handleCreate = () => {
    const n = name.trim();
    if (!n) return;
    onCreate(n, currency);
    setName("");
    addToast(`Trip "${n}" created`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--surface-gradient)" }}>
      {/* Decorative orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-float" style={{ background: "var(--accent)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl animate-float-delayed" style={{ background: "var(--accent)" }} />
      <div className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full opacity-5 blur-2xl animate-float" style={{ background: "var(--accent)" }} />

      <div className="w-full max-w-lg animate-scaleIn relative z-10">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <SuitcaseIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Travel Split</h1>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>Split expenses effortlessly with friends</p>
        </div>

        {/* Main card */}
        <div className="glass-elevated p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Start a Trip</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create a new trip to begin splitting</p>
            </div>
            <ThemeToggle theme={theme} onChange={onThemeChange} />
          </div>

          <div className="space-y-4">
            <input
              className="w-full rounded-xl px-4 py-3.5 text-base transition-shadow min-h-[52px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Where are you going?"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="flex-1 min-w-0 rounded-xl px-4 py-3.5 text-base min-h-[52px]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                  <option key={code} value={code}>{code} — {info.label}</option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                className="gradient-accent text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-all btn-press min-h-[52px] shrink-0 shadow-lg shadow-orange-500/20"
              >
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Trips list */}
        {trips.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Recent Trips
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {trips.length} trip{trips.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {trips.map((trip, idx) => {
                const totalSpent = trip.expenses.reduce(
                  (sum, e) => sum + e.totalAmount * e.exchangeRate, 0,
                );
                const sym = CURRENCY_MAP[trip.baseCurrency]?.symbol ?? trip.baseCurrency;
                return (
                  <div
                    key={trip.id}
                    className="glass-card flex items-center justify-between p-4 transition-all group cursor-pointer row-enter hover:scale-[1.01]"
                    style={{ animationDelay: `${idx * 50}ms`, borderRadius: "16px" }}
                    onClick={() => onSelect(trip.id)}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--border)" }}>
                        <SuitcaseIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{trip.name}</div>
                        <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
                          <span>{trip.members.length} members</span>
                          <span>·</span>
                          <span>{trip.expenses.length} expenses</span>
                          <span>·</span>
                          <span className="font-medium" style={{ color: "var(--accent)" }}>{sym}{totalSpent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete trip "${trip.name}"?`)) {
                          onDelete(trip.id);
                          addToast(`Trip "${trip.name}" deleted`);
                        }
                      }}
                      className="hover:text-red-500 transition-colors px-3 py-2 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {trips.length === 0 && (
          <div className="mt-8 text-center">
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
                  <GlobeIcon className="w-7 h-7" style={{ color: "var(--accent)" }} />
                </div>
              </div>
              <div className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Ready to explore?</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>Create your first trip and start splitting expenses with ease</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
