import { useMemo, useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Plus, Trash2, Pencil, Check, X, Tag as TagIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStocks, StockTrade, StockSale } from "@/hooks/useStocks";

const today = () => format(new Date(), "yyyy-MM-dd");
const sek = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
const amt = (n: number, c: string) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ${c}`;
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const pnlClass = (n: number) => (n > 0 ? "text-green-600 dark:text-green-400" : n < 0 ? "text-destructive" : "");
const TAG_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

interface Realized {
  sale: StockSale; trade: StockTrade; costSEK: number; pnlSEK: number; pnlLocal: number;
  stockEffectSEK: number; fxEffectSEK: number; pnlPct: number; holdDays: number;
}

function computeRealized(trade: StockTrade, sale: StockSale): Realized {
  const feeShare = trade.shares > 0 ? (trade.fees * sale.shares) / trade.shares : 0;
  const costSEK = sale.shares * trade.buy_price * trade.buy_fx_rate + feeShare;
  const proceedsSEK = sale.shares * sale.sell_price * sale.sell_fx_rate - sale.fees;
  const pnlSEK = proceedsSEK - costSEK;
  const pnlLocal = sale.shares * (sale.sell_price - trade.buy_price);
  const stockEffectSEK = pnlLocal * trade.buy_fx_rate;
  const fxEffectSEK = sale.shares * sale.sell_price * (sale.sell_fx_rate - trade.buy_fx_rate);
  return {
    sale, trade, costSEK, pnlSEK, pnlLocal, stockEffectSEK, fxEffectSEK,
    pnlPct: costSEK ? (pnlSEK / costSEK) * 100 : 0,
    holdDays: differenceInDays(parseISO(sale.sell_date), parseISO(trade.buy_date)),
  };
}

export default function Stocks() {
  const s = useStocks();
  const [buyOpen, setBuyOpen] = useState(false);
  const [sellTrade, setSellTrade] = useState<StockTrade | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagEditTrade, setTagEditTrade] = useState<StockTrade | null>(null);

  const soldShares = (id: string) => s.sales.filter((x) => x.trade_id === id).reduce((a, b) => a + b.shares, 0);
  const tagsFor = (id: string) => s.tradeTags.filter((t) => t.trade_id === id).map((t) => s.tags.find((g) => g.id === t.tag_id)).filter(Boolean) as any[];

  const open = s.trades.filter((t) => t.shares - soldShares(t.id) > 1e-9);
  const closed = s.trades.filter((t) => t.shares - soldShares(t.id) <= 1e-9);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">Aktier</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTagsOpen(true)}><TagIcon className="w-4 h-4 mr-2" />Taggar</Button>
          <Button onClick={() => setBuyOpen(true)}><Plus className="w-4 h-4 mr-2" />Nytt köp</Button>
        </div>
      </div>

      <Tabs defaultValue="positions">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="positions">Positioner</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="notes">Anteckningar</TabsTrigger>
          <TabsTrigger value="watch">Bevakningslistor</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Öppna positioner ({open.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Aktie</TableHead><TableHead>Köpdatum</TableHead><TableHead>Antal kvar</TableHead>
                  <TableHead>Köpkurs</TableHead><TableHead>Kurs SEK</TableHead><TableHead>Investerat (SEK)</TableHead>
                  <TableHead>Innehavstid</TableHead><TableHead>Taggar</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {open.map((t) => {
                    const rem = t.shares - soldShares(t.id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell><div className="font-medium">{t.ticker}</div><div className="text-xs text-muted-foreground">{t.name}</div></TableCell>
                        <TableCell>{t.buy_date}</TableCell>
                        <TableCell>{rem}{rem !== t.shares && <span className="text-xs text-muted-foreground"> / {t.shares}</span>}</TableCell>
                        <TableCell>{amt(t.buy_price, t.currency)}</TableCell>
                        <TableCell>{t.buy_fx_rate}</TableCell>
                        <TableCell>{sek(rem * t.buy_price * t.buy_fx_rate)}</TableCell>
                        <TableCell>{differenceInDays(new Date(), parseISO(t.buy_date))} d</TableCell>
                        <TableCell><TagList tags={tagsFor(t.id)} onEdit={() => setTagEditTrade(t)} /></TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button size="sm" variant="outline" onClick={() => setSellTrade(t)}>Sälj</Button>
                          <Button size="icon" variant="ghost" onClick={() => confirm("Ta bort positionen?") && s.deleteTrade(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!open.length && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Inga öppna positioner</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Försäljningar & stängda positioner</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Aktie</TableHead><TableHead>Köp → Sälj</TableHead><TableHead>Antal</TableHead>
                  <TableHead>Köp / Sälj kurs</TableHead><TableHead>Resultat (valuta)</TableHead><TableHead>Resultat SEK</TableHead>
                  <TableHead>Varav aktie / valuta</TableHead><TableHead>Tid</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.sales.map((sale) => {
                    const t = s.trades.find((x) => x.id === sale.trade_id);
                    if (!t) return null;
                    const r = computeRealized(t, sale);
                    const isClosed = closed.includes(t);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell><div className="font-medium">{t.ticker}</div><TagList tags={tagsFor(t.id)} /></TableCell>
                        <TableCell className="whitespace-nowrap">{t.buy_date} → {sale.sell_date}</TableCell>
                        <TableCell>{sale.shares}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.buy_price} / {sale.sell_price} {t.currency}</TableCell>
                        <TableCell className={pnlClass(r.pnlLocal)}>{amt(r.pnlLocal, t.currency)}</TableCell>
                        <TableCell className={pnlClass(r.pnlSEK)}>{sek(r.pnlSEK)} <span className="text-xs">({pct(r.pnlPct)})</span></TableCell>
                        <TableCell className="text-xs whitespace-nowrap"><span className={pnlClass(r.stockEffectSEK)}>{sek(r.stockEffectSEK)}</span> / <span className={pnlClass(r.fxEffectSEK)}>{sek(r.fxEffectSEK)}</span></TableCell>
                        <TableCell>{r.holdDays} d</TableCell>
                        <TableCell><Badge variant={isClosed ? "secondary" : "outline"}>{isClosed ? "Stängd" : "Delsåld"}</Badge></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => s.deleteSale(sale.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {!s.sales.length && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Inga försäljningar ännu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats"><StatsTab s={s} tagsFor={tagsFor} /></TabsContent>
        <TabsContent value="notes"><NotesTab s={s} /></TabsContent>
        <TabsContent value="watch"><WatchTab s={s} /></TabsContent>
      </Tabs>

      <BuyDialog open={buyOpen} onOpenChange={setBuyOpen} s={s} />
      <SellDialog trade={sellTrade} onClose={() => setSellTrade(null)} s={s} remaining={sellTrade ? sellTrade.shares - soldShares(sellTrade.id) : 0} />
      <TagsDialog open={tagsOpen} onOpenChange={setTagsOpen} s={s} />
      <EditTradeTagsDialog trade={tagEditTrade} onClose={() => setTagEditTrade(null)} s={s} />
    </main>
  );
}

function TagList({ tags, onEdit }: { tags: any[]; onEdit?: () => void }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map((g) => <Badge key={g.id} style={{ backgroundColor: g.color }} className="text-primary-foreground border-0">{g.name}</Badge>)}
      {onEdit && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit}><Pencil className="w-3 h-3" /></Button>}
    </div>
  );
}

function TagPicker({ s, value, onChange }: { s: ReturnType<typeof useStocks>; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {s.tags.map((g) => {
        const on = value.includes(g.id);
        return (
          <button key={g.id} type="button" onClick={() => onChange(on ? value.filter((x) => x !== g.id) : [...value, g.id])}
            className={`px-2 py-1 rounded-full text-xs border-2 ${on ? "text-primary-foreground" : ""}`}
            style={{ borderColor: g.color, backgroundColor: on ? g.color : "transparent" }}>{g.name}</button>
        );
      })}
      {!s.tags.length && <span className="text-xs text-muted-foreground">Skapa taggar via "Taggar"-knappen</span>}
    </div>
  );
}

function BuyDialog({ open, onOpenChange, s }: any) {
  const empty = { ticker: "", name: "", buy_date: today(), shares: "", buy_price: "", currency: "SEK", buy_fx_rate: "1", fees: "" };
  const [f, setF] = useState<any>(empty);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    if (!f.ticker || !f.shares || !f.buy_price) return;
    await s.addTrade({
      ticker: f.ticker.trim().toUpperCase(), name: f.name || null, buy_date: f.buy_date, shares: +f.shares,
      buy_price: +f.buy_price, currency: f.currency.toUpperCase(), buy_fx_rate: f.currency.toUpperCase() === "SEK" ? 1 : +f.buy_fx_rate || 1, fees: +f.fees || 0,
    }, tagIds);
    setF(empty); setTagIds([]); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrera köp</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Ticker *</Label><Input value={f.ticker} onChange={set("ticker")} placeholder="AAPL" /></div>
          <div><Label>Namn</Label><Input value={f.name} onChange={set("name")} placeholder="Apple Inc." /></div>
          <div><Label>Köpdatum</Label><Input type="date" value={f.buy_date} onChange={set("buy_date")} /></div>
          <div><Label>Antal aktier *</Label><Input type="number" value={f.shares} onChange={set("shares")} /></div>
          <div><Label>Köpkurs *</Label><Input type="number" step="any" value={f.buy_price} onChange={set("buy_price")} /></div>
          <div><Label>Valuta</Label>
            <Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v, buy_fx_rate: v === "SEK" ? "1" : f.buy_fx_rate })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["SEK", "USD", "EUR", "NOK", "DKK", "GBP", "CAD", "CHF", "JPY"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Växelkurs till SEK</Label><Input type="number" step="any" value={f.buy_fx_rate} onChange={set("buy_fx_rate")} disabled={f.currency === "SEK"} /></div>
          <div><Label>Avgifter (SEK)</Label><Input type="number" step="any" value={f.fees} onChange={set("fees")} placeholder="0" /></div>
        </div>
        <div><Label>Taggar</Label><div className="mt-2"><TagPicker s={s} value={tagIds} onChange={setTagIds} /></div></div>
        <DialogFooter><Button onClick={submit}>Spara</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SellDialog({ trade, onClose, s, remaining }: any) {
  const [f, setF] = useState<any>({ sell_date: today(), shares: "", sell_price: "", sell_fx_rate: "", fees: "" });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  if (!trade) return null;
  const submit = async () => {
    const sh = +f.shares;
    if (!sh || sh > remaining + 1e-9 || !f.sell_price) return;
    await s.addSale({ trade_id: trade.id, sell_date: f.sell_date, shares: sh, sell_price: +f.sell_price, sell_fx_rate: trade.currency === "SEK" ? 1 : +f.sell_fx_rate || trade.buy_fx_rate, fees: +f.fees || 0 });
    setF({ sell_date: today(), shares: "", sell_price: "", sell_fx_rate: "", fees: "" }); onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Sälj {trade.ticker} ({remaining} kvar)</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Säljdatum</Label><Input type="date" value={f.sell_date} onChange={set("sell_date")} /></div>
          <div><Label>Antal (max {remaining})</Label>
            <div className="flex gap-1"><Input type="number" value={f.shares} onChange={set("shares")} /><Button type="button" variant="outline" onClick={() => setF({ ...f, shares: String(remaining) })}>Alla</Button></div>
          </div>
          <div><Label>Säljkurs ({trade.currency})</Label><Input type="number" step="any" value={f.sell_price} onChange={set("sell_price")} /></div>
          <div><Label>Växelkurs till SEK</Label><Input type="number" step="any" value={trade.currency === "SEK" ? "1" : f.sell_fx_rate} onChange={set("sell_fx_rate")} disabled={trade.currency === "SEK"} placeholder={String(trade.buy_fx_rate)} /></div>
          <div><Label>Avgifter (SEK)</Label><Input type="number" step="any" value={f.fees} onChange={set("fees")} placeholder="0" /></div>
        </div>
        <DialogFooter><Button onClick={submit}>Registrera försäljning</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagsDialog({ open, onOpenChange, s }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Strategitaggar</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="t.ex. Långsiktig, Swing, Utdelning" />
          <Button onClick={async () => { if (name.trim()) { await s.addTag(name.trim(), color); setName(""); } }}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-1">{TAG_COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
        <div className="space-y-2">
          {s.tags.map((g: any) => (
            <div key={g.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />{g.name}</span>
              <Button size="icon" variant="ghost" onClick={() => s.deleteTag(g.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTradeTagsDialog({ trade, onClose, s }: any) {
  const [val, setVal] = useState<string[] | null>(null);
  if (!trade) return null;
  const current = val ?? s.tradeTags.filter((t: any) => t.trade_id === trade.id).map((t: any) => t.tag_id);
  return (
    <Dialog open onOpenChange={(o) => { if (!o) { setVal(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Taggar för {trade.ticker}</DialogTitle></DialogHeader>
        <TagPicker s={s} value={current} onChange={setVal} />
        <DialogFooter><Button onClick={async () => { await s.updateTradeTags(trade.id, current); setVal(null); onClose(); }}>Spara</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsTab({ s, tagsFor }: { s: ReturnType<typeof useStocks>; tagsFor: (id: string) => any[] }) {
  const [month, setMonth] = useState("all");
  const [ticker, setTicker] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<"sek" | "pct">("sek");

  const tradeMatch = (t: StockTrade) =>
    (ticker === "all" || t.ticker === ticker) && (tag === "all" || s.tradeTags.some((x) => x.trade_id === t.id && x.tag_id === tag));

  const allRealized = useMemo(() => s.sales.map((sale) => {
    const t = s.trades.find((x) => x.id === sale.trade_id);
    return t ? computeRealized(t, sale) : null;
  }).filter(Boolean) as Realized[], [s.sales, s.trades]);

  const months = Array.from(new Set([...allRealized.map((r) => r.sale.sell_date.slice(0, 7)), ...s.trades.map((t) => t.buy_date.slice(0, 7))])).sort().reverse();
  const tickers = Array.from(new Set(s.trades.map((t) => t.ticker))).sort();

  const realized = allRealized.filter((r) => tradeMatch(r.trade) && (month === "all" || r.sale.sell_date.startsWith(month)));
  const buys = s.trades.filter((t) => tradeMatch(t) && (month === "all" || t.buy_date.startsWith(month)));

  const totalInvested = buys.reduce((a, t) => a + t.shares * t.buy_price * t.buy_fx_rate + t.fees, 0);
  const totalPnl = realized.reduce((a, r) => a + r.pnlSEK, 0);
  const totalCost = realized.reduce((a, r) => a + r.costSEK, 0);
  const stockEff = realized.reduce((a, r) => a + r.stockEffectSEK, 0);
  const fxEff = realized.reduce((a, r) => a + r.fxEffectSEK, 0);
  const wins = realized.filter((r) => r.pnlSEK > 0).length;
  const avgHold = realized.length ? realized.reduce((a, r) => a + r.holdDays, 0) / realized.length : 0;

  const timeline = [...realized].sort((a, b) => a.sale.sell_date.localeCompare(b.sale.sell_date))
    .reduce<{ date: string; total: number }[]>((acc, r) => {
      const prev = acc.length ? acc[acc.length - 1].total : 0;
      acc.push({ date: r.sale.sell_date, total: Math.round(prev + r.pnlSEK) });
      return acc;
    }, []);
  const perStock = Object.entries(realized.reduce<Record<string, number>>((acc, r) => { acc[r.trade.ticker] = (acc[r.trade.ticker] || 0) + r.pnlSEK; return acc; }, {}))
    .map(([ticker, pnl]) => ({ ticker, pnl: Math.round(pnl) })).sort((a, b) => b.pnl - a.pnl);
  const sorted = [...realized].sort((a, b) => sortBy === "sek" ? b.pnlSEK - a.pnlSEK : b.pnlPct - a.pnlPct);

  const Stat = ({ label, value, cls = "" }: any) => (
    <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">{label}</div><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent></Card>
  );
  const TradeRow = ({ r }: { r: Realized }) => (
    <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
      <div><span className="font-medium">{r.trade.ticker}</span> <span className="text-muted-foreground text-xs">{r.sale.sell_date} · {r.holdDays} d</span></div>
      <div className={pnlClass(r.pnlSEK)}>{sek(r.pnlSEK)} ({pct(r.pnlPct)})</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alla månader</SelectItem>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={ticker} onValueChange={setTicker}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alla aktier</SelectItem>{tickers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={tag} onValueChange={setTag}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alla taggar</SelectItem>{s.tags.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Totalt investerat" value={sek(totalInvested)} />
        <Stat label="Realiserat resultat" value={`${sek(totalPnl)}`} cls={pnlClass(totalPnl)} />
        <Stat label="Resultat %" value={pct(totalCost ? (totalPnl / totalCost) * 100 : 0)} cls={pnlClass(totalPnl)} />
        <Stat label="Antal affärer (köp / sälj)" value={`${buys.length} / ${realized.length}`} />
        <Stat label="Vinstandel" value={realized.length ? `${Math.round((wins / realized.length) * 100)}%` : "–"} />
        <Stat label="Snittlig innehavstid" value={`${Math.round(avgHold)} dagar`} />
        <Stat label="Varav från aktien" value={sek(stockEff)} cls={pnlClass(stockEff)} />
        <Stat label="Varav från valuta" value={sek(fxEff)} cls={pnlClass(fxEff)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Resultat över tid (SEK)</CardTitle></CardHeader><CardContent className="h-72">
          <ResponsiveContainer><LineChart data={timeline}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="total" name="Ackumulerat" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Resultat per aktie (SEK)</CardTitle></CardHeader><CardContent className="h-72">
          <ResponsiveContainer><BarChart data={perStock}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="ticker" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
            <Bar dataKey="pnl" name="Resultat">{perStock.map((p) => <Cell key={p.ticker} fill={p.pnl >= 0 ? "hsl(142 71% 45%)" : "hsl(var(--destructive))"} />)}</Bar></BarChart></ResponsiveContainer>
        </CardContent></Card>
      </div>

      <div className="flex gap-2 items-center"><span className="text-sm text-muted-foreground">Sortera efter:</span>
        <Button size="sm" variant={sortBy === "sek" ? "default" : "outline"} onClick={() => setSortBy("sek")}>SEK</Button>
        <Button size="sm" variant={sortBy === "pct" ? "default" : "outline"} onClick={() => setSortBy("pct")}>Procent</Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Bästa affärer</CardTitle></CardHeader><CardContent className="space-y-2">
          {sorted.slice(0, 10).map((r) => <TradeRow key={r.sale.id} r={r} />)}{!sorted.length && <p className="text-muted-foreground text-sm">Inga data</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Sämsta affärer</CardTitle></CardHeader><CardContent className="space-y-2">
          {[...sorted].reverse().slice(0, 10).map((r) => <TradeRow key={r.sale.id} r={r} />)}{!sorted.length && <p className="text-muted-foreground text-sm">Inga data</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}

function NotesTab({ s }: { s: ReturnType<typeof useStocks> }) {
  const tickers = Array.from(new Set([...s.trades.map((t) => t.ticker), ...s.notes.map((n) => n.ticker), ...s.watchlistItems.map((w) => w.ticker)])).sort();
  const [ticker, setTicker] = useState("");
  const [custom, setCustom] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(today());
  const active = ticker || tickers[0] || "";
  const notes = s.notes.filter((n) => n.ticker === active).sort((a, b) => b.note_date.localeCompare(a.note_date));
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-4">
      <Card><CardContent className="pt-4 space-y-1">
        {tickers.map((t) => <Button key={t} variant={t === active ? "default" : "ghost"} className="w-full justify-start" onClick={() => setTicker(t)}>{t} <span className="ml-auto text-xs opacity-70">{s.notes.filter((n) => n.ticker === t).length}</span></Button>)}
        <div className="flex gap-1 pt-2"><Input placeholder="Ny ticker" value={custom} onChange={(e) => setCustom(e.target.value)} /><Button size="icon" variant="outline" onClick={() => { if (custom.trim()) { setTicker(custom.trim().toUpperCase()); setCustom(""); } }}><Plus className="w-4 h-4" /></Button></div>
      </CardContent></Card>
      <div className="space-y-4">
        {active ? (<>
          <Card><CardHeader><CardTitle>Ny anteckning – {active}</CardTitle></CardHeader><CardContent className="space-y-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Varför köpte/sålde jag? Tankar..." />
            <Button onClick={async () => { if (content.trim()) { await s.addNote(active, content.trim(), date); setContent(""); } }}>Spara anteckning</Button>
          </CardContent></Card>
          <div className="border-l-2 border-muted pl-4 space-y-3">
            {notes.map((n) => (
              <Card key={n.id}><CardContent className="pt-4">
                <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium text-muted-foreground">{n.note_date}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => s.deleteNote(n.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                <p className="whitespace-pre-wrap text-sm">{n.content}</p>
              </CardContent></Card>
            ))}
            {!notes.length && <p className="text-muted-foreground text-sm">Inga anteckningar ännu.</p>}
          </div>
        </>) : <p className="text-muted-foreground">Lägg till en ticker för att börja skriva anteckningar.</p>}
      </div>
    </div>
  );
}

function WatchTab({ s }: { s: ReturnType<typeof useStocks> }) {
  const [newList, setNewList] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [inputs, setInputs] = useState<Record<string, { ticker: string; name: string }>>({});
  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-md"><Input placeholder="Ny lista, t.ex. Att köpa" value={newList} onChange={(e) => setNewList(e.target.value)} />
        <Button onClick={async () => { if (newList.trim()) { await s.addWatchlist(newList.trim()); setNewList(""); } }}><Plus className="w-4 h-4 mr-2" />Skapa</Button></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {s.watchlists.map((w) => {
          const inp = inputs[w.id] || { ticker: "", name: "" };
          return (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                {editing?.id === w.id ? (
                  <div className="flex gap-1 flex-1"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={async () => { await s.renameWatchlist(w.id, editing.name); setEditing(null); }}><Check className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button></div>
                ) : (<>
                  <CardTitle className="text-lg">{w.name}</CardTitle>
                  <div><Button size="icon" variant="ghost" onClick={() => setEditing({ id: w.id, name: w.name })}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => confirm("Ta bort listan?") && s.deleteWatchlist(w.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                </>)}
              </CardHeader>
              <CardContent className="space-y-2">
                {s.watchlistItems.filter((i) => i.watchlist_id === w.id).map((i) => (
                  <div key={i.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span><span className="font-medium">{i.ticker}</span> <span className="text-xs text-muted-foreground">{i.name}</span></span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => s.removeWatchItem(i.id)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Input placeholder="Ticker" value={inp.ticker} onChange={(e) => setInputs({ ...inputs, [w.id]: { ...inp, ticker: e.target.value } })} />
                  <Input placeholder="Namn" value={inp.name} onChange={(e) => setInputs({ ...inputs, [w.id]: { ...inp, name: e.target.value } })} />
                  <Button size="icon" onClick={async () => { if (inp.ticker.trim()) { await s.addWatchItem(w.id, inp.ticker.trim().toUpperCase(), inp.name.trim()); setInputs({ ...inputs, [w.id]: { ticker: "", name: "" } }); } }}><Plus className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!s.watchlists.length && <p className="text-muted-foreground">Inga listor ännu.</p>}
    </div>
  );
}
