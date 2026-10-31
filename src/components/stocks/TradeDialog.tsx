import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StockTrade, useStocks } from "@/hooks/useStocks";
import { fmtShares, sek } from "@/lib/stockCalc";
import { TagPicker } from "./TagPicker";
import { useAutoFx } from "./useAutoFx";

const CURRENCIES = ["SEK", "USD", "EUR", "NOK", "DKK", "GBP", "CAD", "CHF", "JPY"];

type Stocks = ReturnType<typeof useStocks>;

interface TradeDialogProps {
  s: Stocks;
  /** Edit this trade; omit to register a new buy */
  trade?: StockTrade;
  /** Pre-filled stock for "Köp mer" */
  prefill?: { ticker: string; name: string | null; currency: string };
  onClose: () => void;
}

export function TradeDialog({ s, trade, prefill, onClose }: TradeDialogProps) {
  const isEdit = !!trade;
  const [ticker, setTicker] = useState(trade?.ticker ?? prefill?.ticker ?? "");
  const [name, setName] = useState(trade?.name ?? prefill?.name ?? "");
  const [date, setDate] = useState(trade?.buy_date ?? format(new Date(), "yyyy-MM-dd"));
  const [shares, setShares] = useState(trade ? String(trade.shares) : "");
  const [price, setPrice] = useState(trade ? String(trade.buy_price) : "");
  const [currency, setCurrency] = useState(trade?.currency ?? prefill?.currency ?? "SEK");
  const [fees, setFees] = useState(trade?.fees ? String(trade.fees) : "");
  const [tagIds, setTagIds] = useState<string[]>(
    trade ? s.tradeTags.filter((t) => t.trade_id === trade.id).map((t) => t.tag_id) : []
  );
  const [saving, setSaving] = useState(false);
  const fx = useAutoFx(currency, date, trade ? String(trade.buy_fx_rate) : "1", !isEdit);

  const sold = trade ? s.sales.filter((x) => x.trade_id === trade.id).reduce((a, x) => a + x.shares, 0) : 0;

  // Stocks used before – one tap fills ticker, name and currency
  const known = useMemo(() => {
    const map = new Map<string, { ticker: string; name: string | null; currency: string }>();
    for (const t of [...s.trades].reverse()) if (!map.has(t.ticker)) map.set(t.ticker, { ticker: t.ticker, name: t.name, currency: t.currency });
    for (const w of s.watchlistItems) if (!map.has(w.ticker)) map.set(w.ticker, { ticker: w.ticker, name: w.name, currency: "" });
    return [...map.values()];
  }, [s.trades, s.watchlistItems]);

  const pick = (k: { ticker: string; name: string | null; currency: string }) => {
    setTicker(k.ticker);
    setName(k.name ?? "");
    if (k.currency && k.currency !== currency) {
      setCurrency(k.currency);
      fx.resume();
    }
  };

  const nShares = Number(shares);
  const nPrice = Number(price);
  const nFx = currency === "SEK" ? 1 : Number(fx.rate);
  const totalSEK = nShares * nPrice * nFx + (Number(fees) || 0);
  const sharesError = isEdit && nShares + 1e-9 < sold ? `Minst ${fmtShares(sold)} (redan sålda)` : null;
  const valid = ticker.trim() && nShares > 0 && nPrice > 0 && nFx > 0 && !sharesError;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const row = {
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || null,
      buy_date: date,
      shares: nShares,
      buy_price: nPrice,
      currency,
      buy_fx_rate: nFx,
      fees: Number(fees) || 0,
    };
    try {
      if (trade) {
        await s.updateTrade(trade.id, row);
        await s.updateTradeTags(trade.id, tagIds);
      } else {
        await s.addTrade(row, tagIds);
      }
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Redigera köp – ${trade.ticker}` : "Registrera köp"}</DialogTitle>
        </DialogHeader>

        {!isEdit && known.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tidigare aktier</Label>
            <div className="flex flex-wrap gap-2">
              {known.map((k) => (
                <Button
                  key={k.ticker}
                  type="button"
                  size="sm"
                  variant={ticker.toUpperCase() === k.ticker ? "default" : "outline"}
                  className="rounded-full h-7"
                  onClick={() => pick(k)}
                >
                  {k.ticker}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ticker *</Label>
            <Input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" />
          </div>
          <div>
            <Label>Namn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." />
          </div>
          <div>
            <Label>Köpdatum</Label>
            <Input
              type="date"
              value={date}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setDate(e.target.value);
                fx.resume();
              }}
            />
          </div>
          <div>
            <Label>Antal aktier *</Label>
            <Input type="number" inputMode="decimal" step="any" value={shares} onChange={(e) => setShares(e.target.value)} />
            {sharesError && <p className="text-xs text-destructive mt-1">{sharesError}</p>}
          </div>
          <div>
            <Label>Köpkurs ({currency}) *</Label>
            <Input type="number" inputMode="decimal" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>Valuta</Label>
            <Select
              value={currency}
              onValueChange={(v) => {
                setCurrency(v);
                fx.resume();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Växelkurs till SEK</Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={currency === "SEK" ? "1" : fx.rate}
                onChange={(e) => fx.setManual(e.target.value)}
                disabled={currency === "SEK"}
              />
              {fx.loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {currency !== "SEK" && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {fx.failed ? "Kunde inte hämta kurs – fyll i manuellt" : fx.source ? `ECB-kurs ${fx.source.date}` : "Egen kurs"}
              </p>
            )}
          </div>
          <div>
            <Label>Avgifter (SEK)</Label>
            <Input type="number" inputMode="decimal" step="any" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div>
          <Label>Taggar</Label>
          <div className="mt-2">
            <TagPicker tags={s.tags} value={tagIds} onChange={setTagIds} />
          </div>
        </div>

        {totalSEK > 0 && Number.isFinite(totalSEK) && (
          <p className="text-sm text-muted-foreground">
            Totalt: <span className="font-semibold text-foreground">{sek(totalSEK)}</span>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {isEdit ? "Spara ändringar" : "Spara köp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
