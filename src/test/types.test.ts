import { describe, it, expect } from "vitest";
import {
  generateId,
  todayString,
  formatDateShort,
  getCategoryLabel,
  BUILT_IN_CATEGORIES,
  DEFAULT_EXCHANGE_RATES,
} from "../types";

describe("generateId", () => {
  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("generates a non-empty string", () => {
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe("todayString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatDateShort", () => {
  it("formats a date string", () => {
    const result = formatDateShort("2025-06-15");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });

  it("handles ISO date strings", () => {
    const result = formatDateShort("2025-01-01");
    expect(result).toContain("Jan");
    expect(result).toContain("1");
  });
});

describe("getCategoryLabel", () => {
  it("returns label for built-in categories", () => {
    expect(getCategoryLabel("food")).toBe("Food & Drinks");
    expect(getCategoryLabel("transport")).toBe("Transport");
    expect(getCategoryLabel("accommodation")).toBe("Accommodation");
    expect(getCategoryLabel("activities")).toBe("Activities");
    expect(getCategoryLabel("shopping")).toBe("Shopping");
    expect(getCategoryLabel("utilities")).toBe("Utilities");
    expect(getCategoryLabel("other")).toBe("Other");
  });

  it("returns the custom category name as-is", () => {
    expect(getCategoryLabel("custom_cat")).toBe("custom_cat");
    expect(getCategoryLabel("My Category")).toBe("My Category");
  });
});

describe("BUILT_IN_CATEGORIES", () => {
  it("has 7 categories", () => {
    expect(Object.keys(BUILT_IN_CATEGORIES)).toHaveLength(7);
  });

  it("each category has a label", () => {
    for (const cat of Object.values(BUILT_IN_CATEGORIES)) {
      expect(cat.label).toBeTruthy();
    }
  });
});

describe("DEFAULT_EXCHANGE_RATES", () => {
  it("HKD is 1 (base currency)", () => {
    expect(DEFAULT_EXCHANGE_RATES.HKD).toBe(1);
  });

  it("has rates for all currency codes", () => {
    expect(Object.keys(DEFAULT_EXCHANGE_RATES)).toHaveLength(24);
  });
});
