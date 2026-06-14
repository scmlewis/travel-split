import type { MemberBalance, Member } from "../types";
import Avatar from "./Avatar";
import { ClipboardIcon } from "./Icons";

interface MemberBalancesProps {
  balances: MemberBalance[];
  members: Member[];
  baseSymbol: string;
}

export default function MemberBalances({ balances, members, baseSymbol }: MemberBalancesProps) {
  if (balances.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
          Member Balances
        </h2>
        <div className="glass-card text-center py-10 px-4 animate-fadeIn">
          <div className="flex justify-center mb-3" style={{ color: "var(--text-muted)" }}>
            <ClipboardIcon className="w-10 h-10" />
          </div>
          <div className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No balances yet</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see who owes what</div>
        </div>
      </section>
    );
  }

  const maxAbs = Math.max(...balances.map((b) => Math.abs(b.net)), 1);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Member Balances
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {balances
          .slice()
          .sort((a, b) => b.net - a.net)
          .map((b) => {
            const member = members.find((m) => m.id === b.memberId);
            const pct = maxAbs > 0 ? (Math.abs(b.net) / maxAbs) * 100 : 0;
            const isPositive = b.net > 0.01;
            const isNegative = b.net < -0.01;
            const isSettled = !isPositive && !isNegative;

            return (
              <div key={b.memberId} className="glass-card px-4 py-3.5 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2.5">
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
                <div className="h-2 rounded-full overflow-hidden relative" style={{ background: "var(--border)" }}>
                  {isPositive && (
                    <div
                      className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full balance-bar opacity-60"
                      style={{ width: `${pct / 2}%`, left: "50%" }}
                    />
                  )}
                  {isNegative && (
                    <div
                      className="absolute top-0 h-full bg-red-400 dark:bg-red-500 rounded-full balance-bar opacity-60"
                      style={{ width: `${pct / 2}%`, right: "50%" }}
                    />
                  )}
                  <div className="absolute left-1/2 top-0 w-px h-full" style={{ background: "var(--text-muted)" }} />
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
