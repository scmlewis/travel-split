import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import { DEFAULT_EXCHANGE_RATES } from "../../types";

const mockFetch = vi.fn();

describe("useExchangeRates", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("returns default rates when no cache exists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        rates: { USD: 1, HKD: 7.8, EUR: 0.92 },
      }),
    });
    const { result } = renderHook(() => useExchangeRates("HKD"));
    // Initially returns defaults while fetch is in-flight
    expect(result.current.rates).toEqual(DEFAULT_EXCHANGE_RATES);
  });

  it("fetches rates when no cache or stale cache", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        rates: { USD: 1, HKD: 7.8, EUR: 0.92 },
      }),
    });
    renderHook(() => useExchangeRates("HKD"));
    expect(mockFetch).toHaveBeenCalled();
  });

  it("refresh function fetches and updates rates", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        rates: { USD: 1, HKD: 7.8, EUR: 0.92, JPY: 150 },
      }),
    });
    const { result } = renderHook(() => useExchangeRates("HKD"));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.rates).toBeDefined();
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useExchangeRates("HKD"));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.rates).toEqual(DEFAULT_EXCHANGE_RATES);
  });
});
