import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { CurrencyCode } from "../types";
import { DEFAULT_EXCHANGE_RATES } from "../types";

interface CachedRates {
  usdRates: Record<string, number>;
  timestamp: number;
}

function isValidRate(rate: number): boolean {
  return rate > 0.001 && rate < 10000;
}

export function useExchangeRates(baseCurrency: CurrencyCode) {
  const [cached, setCached] = useLocalStorage<CachedRates | null>("exchange-rates-cache", null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const rates = useMemo(() => {
    if (!cached || !cached.usdRates) return DEFAULT_EXCHANGE_RATES;
    const usdToBase = cached.usdRates[baseCurrency];
    if (!usdToBase || !isValidRate(usdToBase)) return DEFAULT_EXCHANGE_RATES;
    const result = { ...DEFAULT_EXCHANGE_RATES };
    const codes = Object.keys(DEFAULT_EXCHANGE_RATES) as CurrencyCode[];
    for (const code of codes) {
      const usdToCode = cached.usdRates[code];
      if (usdToCode && isValidRate(usdToCode) && code !== baseCurrency) {
        const derivedRate = usdToBase / usdToCode;
        if (isValidRate(derivedRate)) {
          result[code] = derivedRate;
        }
      }
    }
    return result;
  }, [cached, baseCurrency]);

  useEffect(() => {
    if (cached && cached.timestamp > Date.now() - 3600000) return;
    const controller = new AbortController();
    fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!mountedRef.current) return;
        if (data.result === "success" && data.rates) {
          const validatedRates: Record<string, number> = {};
          let validCount = 0;
          for (const [code, rate] of Object.entries(data.rates) as [string, number][]) {
            if (isValidRate(rate)) {
              validatedRates[code] = rate;
              validCount++;
            }
          }
          if (validCount > 0) {
            setCached({ usdRates: validatedRates, timestamp: Date.now() });
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [cached, setCached]);

  const refresh = useCallback(async () => {
    try {
      const controller = new AbortController();
      const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (data.result === "success" && data.rates) {
        const validatedRates: Record<string, number> = {};
        let validCount = 0;
        for (const [code, rate] of Object.entries(data.rates) as [string, number][]) {
          if (isValidRate(rate)) {
            validatedRates[code] = rate;
            validCount++;
          }
        }
        if (validCount > 0) {
          setCached({ usdRates: validatedRates, timestamp: Date.now() });
        }
      }
    } catch {
      // offline
    }
  }, [setCached]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isStale = useMemo(() => {
    if (!cached?.timestamp) return true;
    return now - cached.timestamp > 3600000;
  }, [cached, now]);

  const lastUpdated = cached?.timestamp;

  const timeSinceUpdate = useMemo(() => {
    if (!lastUpdated) return null;
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [lastUpdated, now]);

  return { rates, refresh, lastUpdated, isStale, timeSinceUpdate };
}
