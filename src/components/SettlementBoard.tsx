import type { Member, Settlement } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";

interface SettlementBoardProps {
  members: Member[];
  settlements: Settlement[];
  baseSymbol: string;
  paidSettlements: Record<string, boolean>;
  onTogglePaid: (from: string, to: string) => void;
}

export default function SettlementBoard({
  members,
  settlements,
  baseSymbol,
  paidSettlements,
  onTogglePaid,
}: SettlementBoardProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const { addToast } = useToast();

  const unpaid = settlements.filter((s) => !paidSettlements[`${s.from}|${s.to}`]);
  const paid = settlements.filter((s) => paidSettlements[`${s.from}|${s.to}`]);

  const maxAmount = Math.max(...settlements.map((s) => s.amount), 1);

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
        Settlement Board
      </h2>

      {settlements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-3">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Balance Overview
          </div>
          <div className="space-y-3">
            {members.map((m) => {
              const settlementTo = unpaid.find((s) => s.to === m.id);
              const settlementFrom = unpaid.find((s) => s.from === m.id);
              const net = settlementTo ? settlementTo.amount : settlementFrom ? -settlementFrom.amount : 0;
              const pct = maxAmount > 0 ? (Math.abs(net) / maxAmount) * 100 : 0;
              return (
                <div key={m.id}>
                  {/* Desktop: single row */}
                  <div className="hidden sm:flex items-center gap-3 text-sm">
                    <Avatar name={m.name} size="md" />
                    <span className="w-16 truncate text-slate-600 dark:text-slate-300 font-medium">{m.name}</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      {net > 0 && (
                        <div
                          className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, left: "50%" }}
                        />
                      )}
                      {net < 0 && (
                        <div
                          className="absolute top-0 h-full bg-red-400 dark:bg-red-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, right: "50%" }}
                        />
                      )}
                      <div className="absolute left-1/2 top-0 w-px h-full bg-slate-300 dark:bg-slate-500" />
                    </div>
                    <span className={`w-28 text-right tabular-nums font-mono font-semibold text-sm ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                    </span>
                  </div>
                  {/* Mobile: stacked layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Avatar name={m.name} size="sm" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate">{m.name}</span>
                      <span className={`ml-auto text-sm tabular-nums font-mono font-semibold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative ml-8">
                      {net > 0 && (
                        <div
                          className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, left: "50%" }}
                        />
                      )}
                      {net < 0 && (
                        <div
                          className="absolute top-0 h-full bg-red-400 dark:bg-red-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, right: "50%" }}
                        />
                      )}
                      <div className="absolute left-1/2 top-0 w-px h-full bg-slate-300 dark:bg-slate-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {settlements.length === 0 ? (
          <div className="text-center py-12 px-4 animate-fadeIn">
            <div className="text-5xl mb-3">💰</div>
            <div className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-1">All settled up</div>
            <div className="text-sm text-slate-400 dark:text-slate-500">Add expenses to see who owes whom</div>
          </div>
        ) : (
          <>
            {unpaid.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {unpaid.map((s, idx) => {
                  const from = memberMap.get(s.from);
                  const to = memberMap.get(s.to);
                  const pct = (s.amount / maxAmount) * 100;
                  return (
                    <div
                      key={`unpaid-${idx}`}
                      className="px-4 py-3 transition-row row-enter"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Top row: names */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {from && <Avatar name={from.name} size="sm" />}
                          <span className="text-red-600 dark:text-red-400 font-semibold text-sm truncate">{from?.name ?? "?"}</span>
                          <span className="text-slate-300 dark:text-slate-600 text-base shrink-0">→</span>
                          {to && <Avatar name={to.name} size="sm" />}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm truncate">{to?.name ?? "?"}</span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-base text-slate-800 dark:text-slate-100 shrink-0">
                          {baseSymbol}{s.amount.toFixed(2)}
                        </span>
                      </div>
                      {/* Bottom row: progress + button */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-emerald-400 dark:from-red-500 dark:to-emerald-500 rounded-full balance-bar opacity-50"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            onTogglePaid(s.from, s.to);
                            addToast("Settlement marked as paid");
                          }}
                          className="text-sm px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-semibold btn-press min-h-[40px] shrink-0"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {paid.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                <div className="px-4 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-700/30">
                  Settled ({paid.length})
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {paid.map((s, idx) => {
                    const from = memberMap.get(s.from);
                    const to = memberMap.get(s.to);
                    return (
                      <div key={`paid-${idx}`} className="px-4 py-2.5 opacity-50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {from && <Avatar name={from.name} size="sm" />}
                            <span className="text-slate-500 dark:text-slate-400 line-through text-sm truncate">{from?.name ?? "?"}</span>
                            <span className="text-slate-300 dark:text-slate-600 shrink-0">→</span>
                            {to && <Avatar name={to.name} size="sm" />}
                            <span className="text-slate-500 dark:text-slate-400 line-through text-sm truncate">{to?.name ?? "?"}</span>
                            <span className="text-emerald-500 dark:text-emerald-400 text-sm shrink-0">✓</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500 line-through text-sm">
                              {baseSymbol}{s.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                onTogglePaid(s.from, s.to);
                                addToast("Settlement unmarked", "info");
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400 transition-colors btn-press min-h-[36px]"
                            >
                              Undo
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
