import { useMemo } from "react";
import type { Expense, Member, CurrencyCode, SplitType } from "../types";

export interface MemberSpending {
  memberId: string;
  totalPaid: number;
  totalOwed: number;
  net: number;
  expenseCount: number;
}

export interface TimeBreakdown {
  date: string;
  total: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CurrencyBreakdown {
  currency: CurrencyCode;
  totalOriginal: number;
  totalConverted: number;
  count: number;
}

export interface ExpenseStats {
  totalSpent: number;
  averageExpense: number;
  largestExpense: Expense | null;
  smallestExpense: Expense | null;
  expenseCount: number;
  memberSpending: MemberSpending[];
  spendingByDay: TimeBreakdown[];
  spendingByWeek: TimeBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  splitTypeDistribution: Record<SplitType, number>;
  recurringTotal: number;
  recurringCount: number;
  oneTimeTotal: number;
  currencyBreakdown: CurrencyBreakdown[];
  tripDuration: number;
  dailyBurnRate: number;
}

export function useExpenseStats(
  expenses: Expense[],
  members: Member[],
): ExpenseStats {
  return useMemo(() => {
    if (expenses.length === 0) {
      return {
        totalSpent: 0, averageExpense: 0, largestExpense: null, smallestExpense: null,
        expenseCount: 0, memberSpending: [], spendingByDay: [], spendingByWeek: [],
        categoryBreakdown: [], splitTypeDistribution: { equal: 0, exact: 0, percentage: 0, shares: 0 },
        recurringTotal: 0, recurringCount: 0, oneTimeTotal: 0, currencyBreakdown: [],
        tripDuration: 0, dailyBurnRate: 0,
      };
    }

    // Basic aggregates
    const totals = expenses.map((e) => e.totalAmount * e.exchangeRate);
    const totalSpent = totals.reduce((a, b) => a + b, 0);
    const averageExpense = totalSpent / expenses.length;

    let largestExpense = expenses[0];
    let smallestExpense = expenses[0];
    for (let i = 1; i < expenses.length; i++) {
      if (totals[i] > totals[expenses.indexOf(largestExpense)]) largestExpense = expenses[i];
      if (totals[i] < totals[expenses.indexOf(smallestExpense)]) smallestExpense = expenses[i];
    }

    // Per-member spending
    const memberSpending: MemberSpending[] = members.map((m) => ({
      memberId: m.id,
      totalPaid: 0,
      totalOwed: 0,
      net: 0,
      expenseCount: 0,
    }));
    const memberIdx = new Map(memberSpending.map((ms, i) => [ms.memberId, i]));

    for (const exp of expenses) {
      const paidIdx = memberIdx.get(exp.payerId);
      if (paidIdx !== undefined) {
        memberSpending[paidIdx].totalPaid += exp.totalAmount * exp.exchangeRate;
        memberSpending[paidIdx].expenseCount++;
      }
      for (const share of exp.shares) {
        const owedIdx = memberIdx.get(share.memberId);
        if (owedIdx !== undefined) {
          memberSpending[owedIdx].totalOwed += share.amount * exp.exchangeRate;
        }
      }
    }
    for (const ms of memberSpending) {
      ms.net = ms.totalPaid - ms.totalOwed;
    }

    // Spending by day
    const dayMap = new Map<string, { total: number; count: number }>();
    for (let i = 0; i < expenses.length; i++) {
      const d = expenses[i].date;
      const entry = dayMap.get(d) ?? { total: 0, count: 0 };
      entry.total += totals[i];
      entry.count++;
      dayMap.set(d, entry);
    }
    const spendingByDay: TimeBreakdown[] = [...dayMap.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Spending by week
    const weekMap = new Map<string, { total: number; count: number }>();
    for (let i = 0; i < expenses.length; i++) {
      const d = new Date(expenses[i].date + "T00:00:00");
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      const entry = weekMap.get(key) ?? { total: 0, count: 0 };
      entry.total += totals[i];
      entry.count++;
      weekMap.set(key, entry);
    }
    const spendingByWeek: TimeBreakdown[] = [...weekMap.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown
    const catMap = new Map<string, { total: number; count: number }>();
    for (let i = 0; i < expenses.length; i++) {
      const cats = expenses[i].categories ?? ["other"];
      const perCat = totals[i] / cats.length;
      for (const c of cats) {
        const entry = catMap.get(c) ?? { total: 0, count: 0 };
        entry.total += perCat;
        entry.count++;
        catMap.set(c, entry);
      }
    }
    const categoryBreakdown: CategoryBreakdown[] = [...catMap.entries()]
      .map(([category, v]) => ({ category, ...v, percentage: (v.total / totalSpent) * 100 }))
      .sort((a, b) => b.total - a.total);

    // Split type distribution
    const splitTypeDistribution: Record<SplitType, number> = { equal: 0, exact: 0, percentage: 0, shares: 0 };
    for (const exp of expenses) {
      const st = exp.shares[0]?.splitType ?? "equal";
      splitTypeDistribution[st]++;
    }

    // Recurring analysis
    let recurringTotal = 0;
    let recurringCount = 0;
    let oneTimeTotal = 0;
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i].recurring?.enabled) {
        recurringTotal += totals[i];
        recurringCount++;
      } else {
        oneTimeTotal += totals[i];
      }
    }

    // Currency breakdown
    const currMap = new Map<CurrencyCode, { totalOriginal: number; totalConverted: number; count: number }>();
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      const entry = currMap.get(e.currency) ?? { totalOriginal: 0, totalConverted: 0, count: 0 };
      entry.totalOriginal += e.totalAmount;
      entry.totalConverted += totals[i];
      entry.count++;
      currMap.set(e.currency, entry);
    }
    const currencyBreakdown: CurrencyBreakdown[] = [...currMap.entries()]
      .map(([currency, v]) => ({ currency, ...v }))
      .sort((a, b) => b.totalConverted - a.totalConverted);

    // Trip duration & daily burn
    const dates = expenses.map((e) => e.date).sort();
    const firstDate = new Date(dates[0] + "T00:00:00");
    const lastDate = new Date(dates[dates.length - 1] + "T00:00:00");
    const tripDuration = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1);
    const dailyBurnRate = totalSpent / tripDuration;

    return {
      totalSpent, averageExpense, largestExpense, smallestExpense,
      expenseCount: expenses.length, memberSpending, spendingByDay, spendingByWeek,
      categoryBreakdown, splitTypeDistribution, recurringTotal, recurringCount,
      oneTimeTotal, currencyBreakdown, tripDuration, dailyBurnRate,
    };
  }, [expenses, members]);
}
