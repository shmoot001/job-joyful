import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Pencil, Check, X, Tag as TagIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStocks, type StockTrade, type StockSale, type StockTag } from "@/hooks/useStocks";
import { buildLots, buildPositions, computeRealized, pct, pnlClass, sek, EPS, type Realized } from "@/lib/stockCalc";
import { TagPicker } from "@/components/stocks/TagPicker";
import { TradeDialog } from "@/components/stocks/TradeDialog";
import { SaleDialog } from "@/components/stocks/SaleDialog";
import { PositionsView } from "@/components/stocks/PositionsView";
import { SalesList } from "@/components/stocks/SalesList";
import { PortfolioOverview } from "@/components/stocks/PortfolioOverview";
import { AvanzaImportDialog } from "@/components/stocks/AvanzaImportDialog";
import { Upload } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");
const TAG_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

type TradeDialogState = { trade?: StockTrade; prefill?: { ticker: string; name: string | null; currency: string } } | null;

export default function Stocks() {
  const s = useStocks();
  const [tradeDialog, setTradeDialog] = useState<TradeDialogState>(null);
  const [saleDialog, setSaleDialog] = useState<{ trade: StockTrade; sale?: StockSale } | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tagEditTrade, setTagEditTrade] = useState<StockTrade | null>(null);

  const tagsFor = (id: string): StockTag[] =>
    s.tradeTags
      .filter((t) => t.trade_id === id)
      .map((t) => s.tags.find((g) => g.id === t.tag_id))
      .filter((g): g is StockTag => !!g);

  const lots = useMemo(() => buildLots(s.trades, s.sales, tagsFor), [s.trades, s.sales, s.tradeTags, s.tags]); // eslint-disable-line react-hooks/exhaustive-deps
  const openLots = lots.filter((l) => l.remaining > EPS);
  const positions = useMemo(() => buildPositions(lots), [lots]);
  const totalCost = positions.reduce((a, p) => a + p.costSEK, 0);
  const realized = useMemo(
    () =>
      s.sales
        .map((sale) => {
          const t = s.trades.find((x) => x.id === sale.trade_id);
          return t ? computeRealized(t, sale) : null;
        })
        .filter((r): r is Realized => !!r),
    [s.sales, s.trades]
  );

  if (s.isLoading) {
    return <main className="container mx-auto px-4 py-8 text-muted-foreground">Laddar…</main>;
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Aktier</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTagsOpen(true)}>
            <TagIcon className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Taggar</span>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importera Avanza</span>
          </Button>
          <Button onClick={() => setTradeDialog({})}>
            <Plus className="w-4 h-4 mr-2" />
            Nytt köp
          </Button>
        </div>
      </div>

      <Tabs defaultValue="positions">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-auto">
          <TabsTrigger value="positions">Portfölj</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="notes">Anteckn.</TabsTrigger>
          <TabsTrigger value="watch">Bevakning</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-6">
          <PortfolioOverview positions={positions} openLots={openLots} realized={realized} tags={s.tags} />
          <PositionsView
            positions={positions}
            totalCost={totalCost}
            actions={{
              onSell: (trade) => setSaleDialog({ trade }),
              onEditTrade: (trade) => setTradeDialog({ trade }),
              onDeleteTrade: (trade) => {
                const sold = s.sales.some((x) => x.trade_id === trade.id);
                if (confirm(sold ? `Ta bort köpet av ${trade.ticker}? Dess försäljningar tas också bort.` : `Ta bort köpet av ${trade.ticker}?`))
                  s.deleteTrade(trade.id);
              },
              onEditTags: setTagEditTrade,
              onBuyMore: (p) => setTradeDialog({ prefill: { ticker: p.ticker, name: p.name, currency: p.currency } }),
            }}
          />
          <SalesList
            realized={realized}
            lots={lots}
            onEdit={(trade, sale) => setSaleDialog({ trade, sale })}
            onDelete={(sale) => confirm("Ta bort försäljningen?") && s.deleteSale(sale.id)}
          />
        </TabsContent>

        <TabsContent value="stats"><StatsTab s={s} /></TabsContent>
        <TabsContent value="notes"><NotesTab s={s} /></TabsContent>
        <TabsContent value="watch"><WatchTab s={s} /></TabsContent>
      </Tabs>

      {tradeDialog && <TradeDialog s={s} trade={tradeDialog.trade} prefill={tradeDialog.prefill} onClose={() => setTradeDialog(null)} />}
      {saleDialog && <SaleDialog s={s} trade={saleDialog.trade} sale={saleDialog.sale} onClose={() => setSaleDialog(null)} />}
      {importOpen && <AvanzaImportDialog s={s} onClose={() => setImportOpen(false)} />}
      <TagsDialog open={tagsOpen} onOpenChange={setTagsOpen} s={s} />
      {tagEditTrade && <EditTradeTagsDialog key={tagEditTrade.id} trade={tagEditTrade} onClose={() => setTagEditTrade(null)} s={s} />}
    </main>
  );
}

type Stocks = ReturnType<typeof useStocks>;

function TagsDialog({ open, onOpenChange, s }: { open: boolean; onOpenChange: (o: boolean) => void; s: Stocks }) {
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
          {s.tags.map((g) => (
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

function EditTradeTagsDialog({ trade, onClose, s }: { trade: StockTrade; onClose: () => void; s: Stocks }) {
  const [val, setVal] = useState<string[]>(s.tradeTags.filter((t) => t.trade_id === trade.id).map((t) => t.tag_id));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Taggar för {trade.ticker} ({trade.buy_date})</DialogTitle></DialogHeader>
        <TagPicker tags={s.tags} value={val} onChange={setVal} />
        <DialogFooter><Button onClick={async () => { await s.updateTradeTags(trade.id, val); onClose(); }}>Spara</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsTab({ s }: { s: Stocks }) {
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

  const Stat = ({ label, value, cls = "" }: { label: string; value: string; cls?: string }) => (
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

function NotesTab({ s }: { s: Stocks }) {
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

function WatchTab({ s }: { s: Stocks }) {
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
