import { format } from "date-fns";

/**
 * Exchange rates from the European Central Bank via Frankfurter
 * (https://frankfurter.dev – free, no API key, CORS enabled).
 * Weekends/holidays automatically resolve to the previous banking day.
 */
const BASE = "https://api.frankfurter.dev/v1";
const cache = new Map<string, Promise<FxResult | null>>();

export interface FxResult {
  /** SEK per 1 unit of the currency */
  rate: number;
  /** The banking day the rate is from */
  date: string;
}

export const fetchFxToSEK = (currency: string, date: string): Promise<FxResult | null> => {
  const cur = currency.toUpperCase();
  if (cur === "SEK") return Promise.resolve({ rate: 1, date });

  const today = format(new Date(), "yyyy-MM-dd");
  const day = !date || date >= today ? "latest" : date;
  const key = `${cur}-${day}`;

  if (!cache.has(key)) {
    const request = fetch(`${BASE}/${day}?base=${cur}&symbols=SEK`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.rates?.SEK ? { rate: Number(d.rates.SEK), date: d.date as string } : null))
      .catch(() => null);
    cache.set(key, request);
    // Don't keep failures cached
    request.then((r) => r === null && cache.delete(key));
  }
  return cache.get(key)!;
};
