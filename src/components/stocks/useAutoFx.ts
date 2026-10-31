import { useEffect, useState } from "react";
import { fetchFxToSEK } from "@/lib/fx";

/**
 * Keeps an exchange-rate field filled with the ECB rate for the chosen
 * currency and date, until the user types their own rate.
 */
export function useAutoFx(currency: string, date: string, initialRate: string, startAuto: boolean) {
  const [rate, setRate] = useState(initialRate);
  const [auto, setAuto] = useState(startAuto);
  const [source, setSource] = useState<{ date: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (currency === "SEK") {
      setRate("1");
      setSource(null);
      setFailed(false);
      return;
    }
    if (!auto || !date) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchFxToSEK(currency, date).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (r) {
        setRate(String(Math.round(r.rate * 10000) / 10000));
        setSource({ date: r.date });
      } else {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currency, date, auto]);

  return {
    rate,
    loading,
    failed,
    /** Banking day of the auto-filled ECB rate, null when typed manually */
    source: auto ? source : null,
    /** User typed a rate – stop auto-filling */
    setManual: (v: string) => {
      setAuto(false);
      setRate(v);
    },
    /** Date or currency changed by the user – fetch again */
    resume: () => setAuto(true),
  };
}
