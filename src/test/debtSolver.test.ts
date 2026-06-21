import { describe, it, expect } from "vitest";
import { calculateBalances, simplifyDebts } from "../debtSolver";
import type { Expense, Member } from "../types";

const members: Member[] = [
  { id: "m1", name: "Alice" },
  { id: "m2", name: "Bob" },
  { id: "m3", name: "Charlie" },
];

function makeExpense(overrides: Partial<Expense> & { id: string; payerId: string; totalAmount: number; shares: Expense["shares"] }): Expense {
  return {
    title: "Test",
    currency: "HKD",
    exchangeRate: 1,
    createdAt: Date.now(),
    date: "2025-01-01",
    ...overrides,
  };
}

describe("calculateBalances", () => {
  it("returns empty array for no members", () => {
    expect(calculateBalances([], [])).toEqual([]);
  });

  it("returns zero balances for no expenses", () => {
    const balances = calculateBalances([], members);
    expect(balances).toHaveLength(3);
    expect(balances.every((b) => b.net === 0)).toBe(true);
  });

  it("calculates equal split correctly", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 300,
        shares: [
          { memberId: "m1", amount: 100 },
          { memberId: "m2", amount: 100 },
          { memberId: "m3", amount: 100 },
        ],
      }),
    ];
    const balances = calculateBalances(expenses, members);
    const map = new Map(balances.map((b) => [b.memberId, b.net]));
    expect(map.get("m1")).toBe(200); // paid 300, owes 100
    expect(map.get("m2")).toBe(-100); // paid 0, owes 100
    expect(map.get("m3")).toBe(-100); // paid 0, owes 100
  });

  it("handles multiple expenses", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 200,
        shares: [
          { memberId: "m1", amount: 100 },
          { memberId: "m2", amount: 100 },
        ],
      }),
      makeExpense({
        id: "e2",
        payerId: "m2",
        totalAmount: 100,
        shares: [
          { memberId: "m1", amount: 50 },
          { memberId: "m2", amount: 50 },
        ],
      }),
    ];
    const balances = calculateBalances(expenses, members);
    const map = new Map(balances.map((b) => [b.memberId, b.net]));
    expect(map.get("m1")).toBe(50); // paid 200+0, owes 100+50
    expect(map.get("m2")).toBe(-50); // paid 100, owes 100+50
    expect(map.get("m3")).toBe(0);
  });

  it("handles exchange rates", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 100,
        currency: "USD",
        exchangeRate: 7.8,
        shares: [
          { memberId: "m1", amount: 50 },
          { memberId: "m2", amount: 50 },
        ],
      }),
    ];
    const balances = calculateBalances(expenses, members);
    const map = new Map(balances.map((b) => [b.memberId, b.net]));
    // paid: 100*7.8 = 780, owed: 50*7.8 = 390
    expect(map.get("m1")).toBe(390);
    expect(map.get("m2")).toBe(-390);
  });
});

describe("simplifyDebts", () => {
  it("returns empty for no expenses", () => {
    expect(simplifyDebts([], members)).toEqual([]);
  });

  it("simplifies three-person debt to minimum transactions", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 300,
        shares: [
          { memberId: "m1", amount: 100 },
          { memberId: "m2", amount: 100 },
          { memberId: "m3", amount: 100 },
        ],
      }),
    ];
    const settlements = simplifyDebts(expenses, members);
    // Should be 2 settlements (Bob->Alice, Charlie->Alice)
    expect(settlements.length).toBeLessThanOrEqual(2);
    expect(settlements.every((s) => s.amount > 0)).toBe(true);
  });

  it("simplifies two-person debt", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 200,
        shares: [
          { memberId: "m1", amount: 100 },
          { memberId: "m2", amount: 100 },
        ],
      }),
    ];
    const settlements = simplifyDebts(expenses, members);
    expect(settlements).toHaveLength(1);
    expect(settlements[0].from).toBe("m2");
    expect(settlements[0].to).toBe("m1");
    expect(settlements[0].amount).toBe(100);
  });

  it("returns empty when all settled", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        payerId: "m1",
        totalAmount: 100,
        shares: [{ memberId: "m1", amount: 100 }],
      }),
      makeExpense({
        id: "e2",
        payerId: "m2",
        totalAmount: 100,
        shares: [{ memberId: "m2", amount: 100 }],
      }),
    ];
    const settlements = simplifyDebts(expenses, members);
    expect(settlements).toEqual([]);
  });

  it("uses precomputed balances", () => {
    const balances = [
      { memberId: "m1", net: 100 },
      { memberId: "m2", net: -100 },
      { memberId: "m3", net: 0 },
    ];
    const settlements = simplifyDebts([], members, balances);
    expect(settlements).toHaveLength(1);
    expect(settlements[0].from).toBe("m2");
    expect(settlements[0].to).toBe("m1");
    expect(settlements[0].amount).toBe(100);
  });
});
