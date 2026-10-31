import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockSale, StockTrade } from "@/hooks/useStocks";
import { amt, fmtShares, pct, pnlClass, sek, type Lot, type Realized } from "@/lib/stockCalc";
import { TagList } from "./TagPicker";

interface SalesListProps {
  realized: Realized[];
  lots: Lot[];
  onEdit: (trade: StockTrade, sale: StockSale) => void;
  onDelete: (sale: StockSale) => void;
}

export function SalesList({ realized, lots, onEdit, onDelete }: SalesListProps) {
  const lotFor = (tradeId: string) => lots.find((l) => l.trade.id === tradeId);
  const rows = [...realized].sort((a, b) => b.sale.sell_date.localeCompare(a.sale.sell_date));
  const total = rows.reduce((a, r) => a + r.pnlSEK, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle>Försäljningar ({rows.length})</CardTitle>
        {rows.length > 0 && (
          <span className={`text-sm font-semibold tabular-nums ${pnlClass(total)}`}>Totalt {sek(total)}</span>
        )}
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        {rows.length === 0 && <p className="text-center text-muted-foreground py-6">Inga försäljningar ännu</p>}

        {rows.length > 0 && (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktie</TableHead>
                  <TableHead>Köp → Sälj</TableHead>
                  <TableHead className="text-right">Antal</TableHead>
                  <TableHead className="text-right">Köp / Sälj</TableHead>
                  <TableHead className="text-right">Resultat</TableHead>
                  <TableHead className="text-right">Aktie / Valuta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const lot = lotFor(r.trade.id);
                  const closed = !lot || lot.remaining <= 1e-9;
                  return (
                    <TableRow key={r.sale.id}>
                      <TableCell>
                        <div className="font-medium">{r.trade.ticker}</div>
                        {lot && lot.tags.length > 0 && <TagList tags={lot.tags} />}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {r.trade.buy_date} → {r.sale.sell_date}
                        <div className="text-xs text-muted-foreground">{r.holdDays} dagar</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtShares(r.sale.shares)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums text-sm">
                        {r.trade.buy_price} / {r.sale.sell_price} {r.trade.currency}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${pnlClass(r.pnlSEK)}`}>
                        {sek(r.pnlSEK)}
                        <div className="text-xs">{pct(r.pnlPct)}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap tabular-nums">
                        {r.trade.currency === "SEK" ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <>
                            <span className={pnlClass(r.stockEffectSEK)}>{sek(r.stockEffectSEK)}</span> /{" "}
                            <span className={pnlClass(r.fxEffectSEK)}>{sek(r.fxEffectSEK)}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={closed ? "secondary" : "outline"}>{closed ? "Stängd" : "Delsåld"}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(r.trade, r.sale)} aria-label="Redigera">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(r.sale)} aria-label="Ta bort">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="md:hidden space-y-2">
          {rows.map((r) => (
            <div key={r.sale.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.trade.ticker}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.sale.sell_date} · {fmtShares(r.sale.shares)} st · {r.holdDays} d
                  </p>
                </div>
                <div className={`text-right font-semibold tabular-nums ${pnlClass(r.pnlSEK)}`}>
                  {sek(r.pnlSEK)}
                  <p className="text-xs font-normal">{pct(r.pnlPct)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {amt(r.trade.buy_price, r.trade.currency)} → {amt(r.sale.sell_price, r.trade.currency)}
                </p>
                <div className="flex">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(r.trade, r.sale)} aria-label="Redigera">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(r.sale)} aria-label="Ta bort">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
