import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StockSale, StockTrade, useStocks } from "@/hooks/useStocks";
import { computeRealized, fmtShares, pct, pnlClass, sek } from "@/lib/stockCalc";
import { useAutoFx } from "./useAutoFx";

type Stocks = ReturnType<typeof useStocks>;

interface SaleDialogProps {
  s: Stocks;
  trade: StockTrade;
  /** Edit this sale; omit to register a new one */
  sale?: StockSale;
  onClose: () => void;
}

export function SaleDialog({ s, trade, sale, onClose }: SaleDialogProps) {
  const isEdit = !!sale;
  const soldOther = s.sales
    .filter((x) => x.trade_id === trade.id && x.id !== sale?.id)
    .reduce((a, x) => a + x.shares, 0);
  const max = Math.max(0, trade.shares - soldOther);

  const [date, setDate] = useState(sale?.sell_date ?? format(new Date(), "yyyy-MM-dd"));
  const [shares, setShares] = useState(sale ? String(sale.shares) : "");
  const [price, setPrice] = useState(sale ? String(sale.sell_price) : "");
  const [fees, setFees] = useState(sale?.fees ? String(sale.fees) : "");
  const [saving, setSaving] = useState(false);
  const fx = useAutoFx(trade.currency, date, sale ? String(sale.sell_fx_rate) : String(trade.buy_fx_rate), !isEdit);

  const nShares = Number(shares);
  const nPrice = Number(price);
  const nFx = trade.currency === "SEK" ? 1 : Number(fx.rate);
  const valid = nShares > 0 && nShares <= max + 1e-9 && nPrice > 0 && nFx > 0;

  const preview = valid
    ? computeRealized(trade, {
        id: "",
        trade_id: trade.id,
        sell_date: date,
        shares: nShares,
        sell_price: nPrice,
        sell_fx_rate: nFx,
        fees: Number(fees) || 0,
      })
    : null;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const row = { sell_date: date, shares: nShares, sell_price: nPrice, sell_fx_rate: nFx, fees: Number(fees) || 0 };
    try {
      if (sale) await s.updateSale(sale.id, row);
      else await s.addSale({ trade_id: trade.id, ...row });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Redigera försäljning" : "Sälj"} {trade.ticker}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (köpt {trade.buy_date}, {fmtShares(max)} tillgängliga)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Säljdatum</Label>
            <Input
              type="date"
              value={date}
              min={trade.buy_date}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setDate(e.target.value);
                fx.resume();
              }}
            />
          </div>
          <div>
            <Label>Antal *</Label>
            <Input type="number" inputMode="decimal" step="any" value={shares} onChange={(e) => setShares(e.target.value)} />
            <div className="flex gap-1 mt-1">
              {[
                { label: "Alla", v: max },
                { label: "Hälften", v: max / 2 },
                { label: "¼", v: max / 4 },
              ].map((o) => (
                <Button
                  key={o.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShares(String(Number.isInteger(max) ? Math.floor(o.v) || o.v : Math.round(o.v * 10000) / 10000))}
                >
                  {o.label}
                </Button>
              ))}
            </div>
            {nShares > max + 1e-9 && <p className="text-xs text-destructive mt-1">Max {fmtShares(max)}</p>}
          </div>
          <div>
            <Label>Säljkurs ({trade.currency}) *</Label>
            <Input type="number" inputMode="decimal" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">Köpkurs: {trade.buy_price} {trade.currency}</p>
          </div>
          <div>
            <Label>Växelkurs till SEK</Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={trade.currency === "SEK" ? "1" : fx.rate}
                onChange={(e) => fx.setManual(e.target.value)}
                disabled={trade.currency === "SEK"}
              />
              {fx.loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {trade.currency !== "SEK" && (
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

        {preview && (
          <div className="rounded-lg bg-muted/60 p-3 text-sm grid grid-cols-2 gap-1">
            <span className="text-muted-foreground">Resultat</span>
            <span className={`text-right font-semibold ${pnlClass(preview.pnlSEK)}`}>
              {sek(preview.pnlSEK)} ({pct(preview.pnlPct)})
            </span>
            {trade.currency !== "SEK" && (
              <>
                <span className="text-muted-foreground">Varav aktie / valuta</span>
                <span className="text-right">
                  <span className={pnlClass(preview.stockEffectSEK)}>{sek(preview.stockEffectSEK)}</span> /{" "}
                  <span className={pnlClass(preview.fxEffectSEK)}>{sek(preview.fxEffectSEK)}</span>
                </span>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {isEdit ? "Spara ändringar" : "Registrera försäljning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
