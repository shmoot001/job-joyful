import { differenceInDays, parseISO } from "date-fns";
import type { StockSale, StockTag, StockTrade } from "@/hooks/useStocks";

export const EPS = 1e-9;

export const sek = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
export const amt = (n: number, c: string) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ${c}`;
export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toLocaleString("sv-SE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`;
export const pnlClass = (n: number) => (n > 0 ? "text-green-600 dark:text-green-400" : n < 0 ? "text-destructive" : "");

export interface Realized {
  sale: StockSale;
  trade: StockTrade;
  costSEK: number;
  proceedsSEK: number;
  pnlSEK: number;
  pnlLocal: number;
  stockEffectSEK: number;
  fxEffectSEK: number;
  pnlPct: number;
  holdDays: number;
}

export function computeRealized(trade: StockTrade, sale: StockSale): Realized {
  const feeShare = trade.shares > 0 ? (trade.fees * sale.shares) / trade.shares : 0;
  const costSEK = sale.shares * trade.buy_price * trade.buy_fx_rate + feeShare;
  const proceedsSEK = sale.shares * sale.sell_price * sale.sell_fx_rate - sale.fees;
  const pnlSEK = proceedsSEK - costSEK;
  const pnlLocal = sale.shares * (sale.sell_price - trade.buy_price);
  const stockEffectSEK = pnlLocal * trade.buy_fx_rate;
  const fxEffectSEK = sale.shares * sale.sell_price * (sale.sell_fx_rate - trade.buy_fx_rate);
  return {
    sale,
    trade,
    costSEK,
    proceedsSEK,
    pnlSEK,
    pnlLocal,
    stockEffectSEK,
    fxEffectSEK,
    pnlPct: costSEK ? (pnlSEK / costSEK) * 100 : 0,
    holdDays: differenceInDays(parseISO(sale.sell_date), parseISO(trade.buy_date)),
  };
}

/** One buy (lot) with what's left of it. */
export interface Lot {
  trade: StockTrade;
  sold: number;
  remaining: number;
  /** Cost of the remaining shares in SEK incl. their share of the buy fee */
  costSEK: number;
  tags: StockTag[];
}

/** All open lots of one ticker, combined. */
export interface Position {
  ticker: string;
  name: string | null;
  currency: string;
  lots: Lot[];
  shares: number;
  /** Average buy price in the stock's currency */
  avgPrice: number;
  costSEK: number;
  firstBuy: string;
  tags: StockTag[];
}

export function buildLots(
  trades: StockTrade[],
  sales: StockSale[],
  tagsFor: (tradeId: string) => StockTag[]
): Lot[] {
  return trades.map((trade) => {
    const sold = sales.filter((s) => s.trade_id === trade.id).reduce((a, s) => a + s.shares, 0);
    const remaining = Math.max(0, trade.shares - sold);
    const feeShare = trade.shares > 0 ? (trade.fees * remaining) / trade.shares : 0;
    return {
      trade,
      sold,
      remaining,
      costSEK: remaining * trade.buy_price * trade.buy_fx_rate + feeShare,
      tags: tagsFor(trade.id),
    };
  });
}

export function buildPositions(lots: Lot[]): Position[] {
  const byTicker = new Map<string, Lot[]>();
  for (const lot of lots) {
    if (lot.remaining <= EPS) continue;
    byTicker.set(lot.trade.ticker, [...(byTicker.get(lot.trade.ticker) ?? []), lot]);
  }
  return [...byTicker.entries()]
    .map(([ticker, ls]) => {
      const sorted = [...ls].sort((a, b) => a.trade.buy_date.localeCompare(b.trade.buy_date));
      const shares = sorted.reduce((a, l) => a + l.remaining, 0);
      const local = sorted.reduce((a, l) => a + l.remaining * l.trade.buy_price, 0);
      const tags = new Map<string, StockTag>();
      sorted.forEach((l) => l.tags.forEach((t) => tags.set(t.id, t)));
      return {
        ticker,
        name: sorted.find((l) => l.trade.name)?.trade.name ?? null,
        currency: sorted[sorted.length - 1].trade.currency,
        lots: sorted,
        shares,
        avgPrice: shares ? local / shares : 0,
        costSEK: sorted.reduce((a, l) => a + l.costSEK, 0),
        firstBuy: sorted[0].trade.buy_date,
        tags: [...tags.values()],
      };
    })
    .sort((a, b) => b.costSEK - a.costSEK);
}

/** Share counts can be fractional – show up to 4 decimals without trailing zeros. */
export const fmtShares = (n: number) => n.toLocaleString("sv-SE", { maximumFractionDigits: 4 });
