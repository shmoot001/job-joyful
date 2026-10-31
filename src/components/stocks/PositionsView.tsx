import { Fragment, useState } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockTrade } from "@/hooks/useStocks";
import { amt, fmtShares, sek, type Lot, type Position } from "@/lib/stockCalc";
import { TagList } from "./TagPicker";

export interface PositionActions {
  onSell: (trade: StockTrade) => void;
  onEditTrade: (trade: StockTrade) => void;
  onDeleteTrade: (trade: StockTrade) => void;
  onEditTags: (trade: StockTrade) => void;
  onBuyMore: (p: Position) => void;
}

const days = (date: string) => differenceInDays(new Date(), parseISO(date));

const LotMenu = ({ lot, a }: { lot: Lot; a: PositionActions }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Fler åtgärder">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => a.onEditTrade(lot.trade)}>
        <Pencil className="h-4 w-4 mr-2" />
        Redigera köp
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => a.onEditTags(lot.trade)}>
        <Tag className="h-4 w-4 mr-2" />
        Taggar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => a.onDeleteTrade(lot.trade)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Ta bort köp
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export function PositionsView({ positions, totalCost, actions }: { positions: Position[]; totalCost: number; actions: PositionActions }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (t: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Innehav ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        {positions.length === 0 && <p className="text-center text-muted-foreground py-6">Inga öppna positioner</p>}

        {/* Desktop */}
        {positions.length > 0 && (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Aktie</TableHead>
                  <TableHead className="text-right">Antal</TableHead>
                  <TableHead className="text-right">Snittkurs</TableHead>
                  <TableHead className="text-right">Investerat</TableHead>
                  <TableHead className="text-right">Andel</TableHead>
                  <TableHead className="text-right">Ägd sedan</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => {
                  const open = expanded.has(p.ticker);
                  return (
                    <Fragment key={p.ticker}>
                      <TableRow className="cursor-pointer" onClick={() => toggle(p.ticker)}>
                        <TableCell className="pr-0">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.ticker}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.name}
                            {p.lots.length > 1 && ` · ${p.lots.length} köp`}
                          </div>
                          {p.tags.length > 0 && <div className="mt-1"><TagList tags={p.tags} /></div>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmtShares(p.shares)}</TableCell>
                        <TableCell className="text-right tabular-nums">{amt(p.avgPrice, p.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{sek(p.costSEK)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totalCost ? `${Math.round((p.costSEK / totalCost) * 100)} %` : "–"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{days(p.firstBuy)} d</TableCell>
                        <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => actions.onBuyMore(p)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Köp mer
                          </Button>
                          {p.lots.length === 1 && (
                            <Button size="sm" variant="outline" onClick={() => actions.onSell(p.lots[0].trade)}>
                              Sälj
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {open &&
                        p.lots.map((lot) => (
                          <TableRow key={lot.trade.id} className="bg-muted/30 hover:bg-muted/40">
                            <TableCell />
                            <TableCell className="text-sm">
                              Köp {lot.trade.buy_date}
                              {lot.tags.length > 0 && <div className="mt-1"><TagList tags={lot.tags} /></div>}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {fmtShares(lot.remaining)}
                              {lot.sold > 0 && <span className="text-xs text-muted-foreground"> / {fmtShares(lot.trade.shares)}</span>}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {amt(lot.trade.buy_price, lot.trade.currency)}
                              {lot.trade.currency !== "SEK" && (
                                <div className="text-xs text-muted-foreground">kurs {lot.trade.buy_fx_rate}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{sek(lot.costSEK)}</TableCell>
                            <TableCell />
                            <TableCell className="text-right text-sm tabular-nums">{days(lot.trade.buy_date)} d</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <Button size="sm" variant="outline" onClick={() => actions.onSell(lot.trade)}>
                                Sälj
                              </Button>
                              <LotMenu lot={lot} a={actions} />
                            </TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {positions.map((p) => {
            const open = expanded.has(p.ticker);
            return (
              <div key={p.ticker} className="rounded-lg border">
                <button type="button" className="w-full p-3 text-left" onClick={() => toggle(p.ticker)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.ticker}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{sek(p.costSEK)}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalCost ? `${Math.round((p.costSEK / totalCost) * 100)} % av portföljen` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Antal</p>
                      <p className="font-medium tabular-nums">{fmtShares(p.shares)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Snittkurs</p>
                      <p className="font-medium tabular-nums">{amt(p.avgPrice, p.currency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ägd sedan</p>
                      <p className="font-medium tabular-nums">{days(p.firstBuy)} d</p>
                    </div>
                  </div>
                  {p.tags.length > 0 && <div className="mt-2"><TagList tags={p.tags} /></div>}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {p.lots.length} köp
                  </p>
                </button>

                {open && (
                  <div className="border-t divide-y">
                    {p.lots.map((lot) => (
                      <div key={lot.trade.id} className="p-3 flex items-center justify-between gap-2 bg-muted/30">
                        <div className="text-xs">
                          <p className="font-medium">Köp {lot.trade.buy_date}</p>
                          <p className="text-muted-foreground tabular-nums">
                            {fmtShares(lot.remaining)} st à {amt(lot.trade.buy_price, lot.trade.currency)} · {sek(lot.costSEK)}
                          </p>
                        </div>
                        <div className="flex items-center shrink-0">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => actions.onSell(lot.trade)}>
                            Sälj
                          </Button>
                          <LotMenu lot={lot} a={actions} />
                        </div>
                      </div>
                    ))}
                    <div className="p-2">
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => actions.onBuyMore(p)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Köp mer {p.ticker}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
