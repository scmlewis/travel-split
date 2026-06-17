import { useMemo } from "react";
import type { MemberBalance, Member, Settlement } from "../types";
import Avatar from "./Avatar";
import { ClipboardIcon } from "./Icons";

interface MemberBalancesProps {
  balances: MemberBalance[];
  members: Member[];
  baseSymbol: string;
  settlements: Settlement[];
}

export default function MemberBalances({ balances, members, baseSymbol, settlements }: MemberBalancesProps) {
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const settlementMap = useMemo(() => {
    const map = new Map<string, { owes: Settlement[]; owedBy: Settlement[] }>();
    for (const s of settlements) {
      if (!map.has(s.from)) map.set(s.from, { owes: [], owedBy: [] });
      if (!map.has(s.to)) map.set(s.to, { owes: [], owedBy: [] });
      map.get(s.from)!.owes.push(s);
      map.get(s.to)!.owedBy.push(s);
    }
    return map;
  }, [settlements]);

  const maxAbs = useMemo(
    () => Math.max(...balances.map((b) => Math.abs(b.net)), 1),
    [balances],
  );

  if (balances.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
          Member Balances
        </h2>
        <div className="card text-center py-10 px-4 animate-fadeIn">
          <div className="flex justify-center mb-3" style={{ color: "var(--text-muted)" }}>
            <ClipboardIcon className="w-10 h-10" />
          </div>
          <div className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No balances yet</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see who owes what</div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Member Balances
      </h2>
      <div className="space-y-3">
        {balances
          .slice()
          .sort((a, b) => b.net - a.net)
          .map((b) => {
            const member = memberMap.get(b.memberId);
            const pct = maxAbs > 0 ? (Math.abs(b.net) / maxAbs) * 100 : 0;
            const isPositive = b.net > 0.01;
            const isNegative = b.net < -0.01;
            const isSettled = !isPositive && !isNegative;

            const { owes, owedBy } = settlementMap.get(b.memberId) ?? { owes: [], owedBy: [] };

            return (
              <div key={b.memberId} className="card px-4 py-3.5 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={member?.name ?? "?"} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {member?.name ?? "?"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {isSettled ? "settled" : isPositive ? "gets back" : "owes"}
                    </div>
                  </div>
                  <span className={`text-base font-bold tabular-nums font-mono shrink-0 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : isNegative ? "text-red-500 dark:text-red-400" : ""}`} style={isSettled ? { color: "var(--text-muted)" } : undefined}>
                    {isSettled ? `${baseSymbol}0.00` : `${isPositive ? "+" : ""}${baseSymbol}${Math.abs(b.net).toFixed(2)}`}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2.5" style={{ background: "var(--border)" }}>
                  {isPositive && (
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#34d399" }} />
                  )}
                  {isNegative && (
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#f87171" }} />
                  )}
                </div>
                {(owes.length > 0 || owedBy.length > 0) && (
                  <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                    {owes.map((s, i) => {
                      const to = memberMap.get(s.to);
                      return (
                        <div key={`owe-${i}`} className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-muted)" }}>
                            pays <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{to?.name ?? "?"}</span>
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-red-500 dark:text-red-400">
                            {baseSymbol}{s.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {owedBy.map((s, i) => {
                      const from = memberMap.get(s.from);
                      return (
                        <div key={`owed-${i}`} className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-muted)" }}>
                            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{from?.name ?? "?"}</span> pays them
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            {baseSymbol}{s.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
}
