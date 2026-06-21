import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useExpenseStats } from "../../hooks/useExpenseStats";
import type { Expense, Member } from "../../types";

const members: Member[] = [
  { id: "m1", name: "Alice" },
  { id: "m2", name: "Bob" },
];

function makeExpense(overrides: Partial<Expense> & { id: string; payerId: string; totalAmount: number }): Expense {
  return {
    title: "Test",
    currency: "HKD",
    exchangeRate: 1,
    date: "2025-06-15",
    createdAt: Date.now(),
    shares: [
      { memberId: "m1", amount: overrides.totalAmount / 2 },
      { memberId: "m2", amount: overrides.totalAmount / 2 },
    ],
    ...overrides,
  };
}

describe("useExpenseStats", () => {
  it("returns empty stats for no expenses", () => {
    const { result } = renderHook(() => useExpenseStats([], members));
    expect(result.current.totalSpent).toBe(0);
    expect(result.current.expenseCount).toBe(0);
    expect(result.current.largestExpense).toBeNull();
    expect(result.current.smallestExpense).toBeNull();
    expect(result.current.memberSpending).toHaveLength(0);
    expect(result.current.spendingByDay).toHaveLength(0);
  });

  it("calculates totalSpent and average", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100 }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 200 }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.totalSpent).toBe(300);
    expect(result.current.averageExpense).toBe(150);
    expect(result.current.expenseCount).toBe(2);
  });

  it("identifies largest and smallest expenses", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 50, title: "Small" }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 300, title: "Large" }),
      makeExpense({ id: "e3", payerId: "m1", totalAmount: 150, title: "Medium" }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.largestExpense?.title).toBe("Large");
    expect(result.current.smallestExpense?.title).toBe("Small");
  });

  it("calculates member spending correctly", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 200 }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    const alice = result.current.memberSpending.find((ms) => ms.memberId === "m1");
    const bob = result.current.memberSpending.find((ms) => ms.memberId === "m2");
    expect(alice?.totalPaid).toBe(200);
    expect(alice?.expenseCount).toBe(1);
    expect(bob?.totalPaid).toBe(0);
  });

  it("calculates spending by day", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100, date: "2025-06-15" }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 200, date: "2025-06-15" }),
      makeExpense({ id: "e3", payerId: "m1", totalAmount: 150, date: "2025-06-16" }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.spendingByDay).toHaveLength(2);
    const day15 = result.current.spendingByDay.find((d) => d.date === "2025-06-15");
    expect(day15?.total).toBe(300);
    expect(day15?.count).toBe(2);
  });

  it("handles expenses with exchange rates", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100, currency: "USD", exchangeRate: 7.8 }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.totalSpent).toBe(780);
  });

  it("calculates recurring stats", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100, recurring: { enabled: true, frequency: "monthly" } }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 200 }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.recurringCount).toBe(1);
    expect(result.current.recurringTotal).toBe(100);
    expect(result.current.oneTimeTotal).toBe(200);
  });

  it("calculates currency breakdown", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100, currency: "HKD", exchangeRate: 1 }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 50, currency: "USD", exchangeRate: 7.8 }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    expect(result.current.currencyBreakdown).toHaveLength(2);
  });

  it("calculates trip duration and daily burn rate", () => {
    const expenses = [
      makeExpense({ id: "e1", payerId: "m1", totalAmount: 100, date: "2025-06-15" }),
      makeExpense({ id: "e2", payerId: "m2", totalAmount: 200, date: "2025-06-17" }),
    ];
    const { result } = renderHook(() => useExpenseStats(expenses, members));
    // 15 to 17 = 3 days
    expect(result.current.tripDuration).toBe(3);
    expect(result.current.dailyBurnRate).toBe(100); // 300/3
  });
});
