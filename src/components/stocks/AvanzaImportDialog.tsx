import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { parseAvanzaCsv, type AvanzaRow } from "@/lib/avanzaImport";
import type { useStocks } from "@/hooks/useStocks";

const db = supabase as any;
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

export function AvanzaImportDialog({ s, onClose }: { s: ReturnType<typeof useStocks>; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rows, setRows] = useState<AvanzaRow[]>([]);
  const [busy, setBusy] = useState(false);

  const onFile = async (f?: File) => {
    if (!f) return;
    const parsed = parseAvanzaCsv(await f.text());
    setRows(parsed);
    if (!parsed.length) toast({ title: "Inga köp eller sälj hittades", description: "Välj filen från Avanza → Transaktioner → Exportera.", variant: "destructive" });
  };

  const run = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const buys = rows.filter((r) => r.type === "buy");
      const newBuys = buys.filter((r) => !s.trades.some((t) => t.ticker === r.name && t.buy_date === r.date && same(t.shares, r.shares) && same(t.buy_price, r.price)));
      let inserted: any[] = [];
      if (newBuys.length) {
        const { data, error } = await db.from("stock_trades").insert(newBuys.map((r) => ({
          user_id: user.id, ticker: r.name, name: r.name, buy_date: r.date, shares: r.shares, buy_price: r.price, currency: r.currency, buy_fx_rate: r.fx, fees: r.fees,
        }))).select();
        if (error) throw error;
        inserted = data.map((d: any) => ({ ...d, shares: Number(d.shares) }));
      }
      // Remaining shares per lot (FIFO by buy date)
      const lots = [...s.trades, ...inserted].map((t) => ({
        id: t.id, ticker: t.ticker, date: t.buy_date,
        left: Number(t.shares) - s.sales.filter((x) => x.trade_id === t.id).reduce((a, x) => a + x.shares, 0),
      })).sort((a, b) => a.date.localeCompare(b.date));

      const sales: any[] = [];
      let skipped = 0;
      for (const r of rows.filter((x) => x.type === "sell")) {
        const dup = s.sales.some((x) => x.sell_date === r.date && same(x.sell_price, r.price) && s.trades.find((t) => t.id === x.trade_id)?.ticker === r.name);
        if (dup) continue;
        let need = r.shares;
        const open = lots.filter((l) => l.ticker === r.name && l.left > 1e-9 && l.date <= r.date);
        for (const l of open) {
          if (need <= 1e-9) break;
          const take = Math.min(need, l.left);
          sales.push({ user_id: user.id, trade_id: l.id, sell_date: r.date, shares: take, sell_price: r.price, sell_fx_rate: r.fx, fees: (r.fees * take) / r.shares });
          l.left -= take; need -= take;
        }
        if (need > 1e-9) skipped++;
      }
      if (sales.length) {
        const { error } = await db.from("stock_sales").insert(sales);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["stocks", user.id] });
      toast({ title: "Import klar", description: `${newBuys.length} köp och ${sales.length} försäljningar importerade${skipped ? `, ${skipped} sälj saknade köp` : ""}.` });
      onClose();
    } catch (e: any) {
      toast({ title: "Import misslyckades", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const buyCount = rows.filter((r) => r.type === "buy").length;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importera från Avanza</DialogTitle>
          <DialogDescription>Avanza → Min ekonomi → Transaktioner → Exportera till CSV. Dubbletter hoppas över.</DialogDescription>
        </DialogHeader>
        <Input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} />
        {rows.length > 0 && (
          <div className="max-h-72 overflow-auto text-sm border rounded">
            <p className="p-2 text-muted-foreground">{buyCount} köp, {rows.length - buyCount} sälj</p>
            {rows.map((r, i) => (
              <div key={i} className="flex justify-between gap-2 px-2 py-1 border-t">
                <span>{r.date} · {r.type === "buy" ? "Köp" : "Sälj"} · {r.name}</span>
                <span className="tabular-nums text-muted-foreground">{r.shares} × {r.price} {r.currency}</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter><Button disabled={!rows.length || busy} onClick={run}>{busy ? "Importerar…" : "Importera"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
