import type { Expense, Member, Settlement, MemberBalance } from "./types";

// Use integer arithmetic for currency (cents)
const toCents = (amount: number): number => Math.round(amount * 100);
const fromCents = (cents: number): number => cents / 100;

export function calculateBalances(expenses: Expense[], members: Member[]): MemberBalance[] {
  if (members.length === 0) return [];

  const balanceMap = new Map<string, number>();
  for (const m of members) balanceMap.set(m.id, 0);

  for (const exp of expenses) {
    const rate = exp.exchangeRate;
    const paidCents = toCents(exp.totalAmount) * rate;
    const currentPayer = balanceMap.get(exp.payerId) ?? 0;
    balanceMap.set(exp.payerId, currentPayer + paidCents);

    for (const share of exp.shares) {
      const owedCents = toCents(share.amount) * rate;
      const currentShare = balanceMap.get(share.memberId) ?? 0;
      balanceMap.set(share.memberId, currentShare - owedCents);
    }
  }

  return Array.from(balanceMap.entries()).map(([memberId, netCents]) => ({
    memberId,
    net: fromCents(Math.round(netCents)),
  }));
}

export function simplifyDebts(
  expenses: Expense[],
  members: Member[],
  precomputedBalances?: MemberBalance[],
): Settlement[] {
  if (members.length === 0) return [];

  const balances = precomputedBalances ?? calculateBalances(expenses, members);

  const creditors: { memberId: string; amount: number }[] = [];
  const debtors: { memberId: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.net > 0.01) creditors.push({ memberId: b.memberId, amount: b.net });
    else if (b.net < -0.01) debtors.push({ memberId: b.memberId, amount: -b.net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    const rounded = Math.round(transfer * 100) / 100;
    if (rounded > 0) {
      settlements.push({
        from: debtors[di].memberId,
        to: creditors[ci].memberId,
        amount: rounded,
      });
    }
    creditors[ci].amount -= rounded;
    debtors[di].amount -= rounded;
    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return settlements;
}
