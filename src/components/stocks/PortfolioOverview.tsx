import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockTag } from "@/hooks/useStocks";
import { pct, pnlClass, sek, type Lot, type Position, type Realized } from "@/lib/stockCalc";

const PIE = ["hsl(var(--primary))", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#64748B"];

type GroupBy = "stock" | "currency" | "tag";

const Tile = ({ label, value, sub, cls = "" }: { label: string; value: string; sub?: React.ReactNode; cls?: string }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold tabular-nums mt-0.5 ${cls}`}>{value}</p>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </CardContent>
  </Card>
);

interface Props {
  positions: Position[];
  openLots: Lot[];
  realized: Realized[];
  tags: StockTag[];
}

export function PortfolioOverview({ positions, openLots, realized, tags }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("stock");
  const [goal, setGoal] = useState<number>(() => Number(localStorage.getItem("stocks-monthly-goal")) || 0);
  const [editGoal, setEditGoal] = useState(false);
  const month = new Date().toISOString().slice(0, 7);
  const monthPnl = realized.filter((r) => r.sale.sell_date.startsWith(month)).reduce((a, r) => a + r.pnlSEK, 0);
  const saveGoal = (v: number) => { setGoal(v); localStorage.setItem("stocks-monthly-goal", String(v)); setEditGoal(false); };

  const invested = positions.reduce((a, p) => a + p.costSEK, 0);
  const year = String(new Date().getFullYear());
  const ytd = realized.filter((r) => r.sale.sell_date.startsWith(year));
  const ytdPnl = ytd.reduce((a, r) => a + r.pnlSEK, 0);
  const ytdCost = ytd.reduce((a, r) => a + r.costSEK, 0);
  const allPnl = realized.reduce((a, r) => a + r.pnlSEK, 0);
  const wins = realized.filter((r) => r.pnlSEK > 0).length;

  // Allocation by cost basis
  const buckets = new Map<string, { label: string; value: number; color?: string }>();
  const add = (key: string, label: string, value: number, color?: string) => {
    const b = buckets.get(key) ?? { label, value: 0, color };
    b.value += value;
    buckets.set(key, b);
  };
  if (groupBy === "stock") positions.forEach((p) => add(p.ticker, p.ticker, p.costSEK));
  if (groupBy === "currency") positions.forEach((p) => add(p.currency, p.currency, p.costSEK));
  if (groupBy === "tag") {
    // A buy with several tags counts towards each of them
    openLots.forEach((l) => {
      if (!l.tags.length) add("_none", "Utan tagg", l.costSEK);
      l.tags.forEach((t) => add(t.id, t.name, l.costSEK, t.color));
    });
  }
  const rows = [...buckets.values()].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Investerat i innehav" value={sek(invested)} sub={`${positions.length} aktier`} />
        <Tile
          label={`Realiserat ${year}`}
          value={sek(ytdPnl)}
          cls={pnlClass(ytdPnl)}
          sub={ytdCost ? pct((ytdPnl / ytdCost) * 100) : `${ytd.length} försäljningar`}
        />
        <Tile label="Realiserat totalt" value={sek(allPnl)} cls={pnlClass(allPnl)} sub={`${realized.length} försäljningar`} />
        <Tile
          label="Vinstandel"
          value={realized.length ? `${Math.round((wins / realized.length) * 100)} %` : "–"}
          sub={realized.length ? `${wins} av ${realized.length} med vinst` : "Inga försäljningar"}
        />
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">Månadsmål {month}</p>
            {editGoal ? (
              <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); saveGoal(Number(new FormData(e.currentTarget).get("g")) || 0); }}>
                <Input name="g" type="number" defaultValue={goal || ""} placeholder="SEK" className="h-8 w-28" autoFocus />
                <Button size="sm" type="submit" className="h-8">Spara</Button>
              </form>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditGoal(true)}>{goal ? "Ändra mål" : "Sätt mål"}</Button>
            )}
          </div>
          {goal > 0 ? (
            <>
              <Progress value={Math.max(0, Math.min(100, (monthPnl / goal) * 100))} />
              <p className="text-xs text-muted-foreground">
                <span className={pnlClass(monthPnl)}>{sek(monthPnl)}</span> av {sek(goal)} ({Math.round((monthPnl / goal) * 100)} %)
                {monthPnl < goal ? ` · ${sek(goal - monthPnl)} kvar` : " · Mål nått!"}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sätt ett mål för realiserad vinst den här månaden.</p>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap pb-3">
            <div>
              <CardTitle className="text-base">Fördelning</CardTitle>
              <p className="text-xs text-muted-foreground">Andel av investerat belopp i dina innehav</p>
            </div>
            <div className="flex gap-1">
              {(
                [
                  ["stock", "Aktie"],
                  ["currency", "Valuta"],
                  ["tag", "Tagg"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  size="sm"
                  variant={groupBy === id ? "default" : "outline"}
                  className="h-7 rounded-full text-xs"
                  onClick={() => setGroupBy(id)}
                  disabled={id === "tag" && tags.length === 0}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-[220px_1fr] gap-4 items-center">
            <div className="h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="label" innerRadius={45} outerRadius={85} paddingAngle={1}>
                    {rows.map((r, i) => <Cell key={r.label} fill={r.color ?? PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => sek(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={r.label} className="flex items-center gap-3" title={`${r.label}: ${sek(r.value)}`}>
                <span className="w-24 shrink-0 text-sm truncate flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color ?? PIE[i % PIE.length] }} />
                  {r.label}
                </span>
                <div className="flex-1 h-5 rounded bg-muted/40 overflow-hidden">
                  <div className="h-full rounded-r bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-sm tabular-nums">
                  {invested ? `${Math.round((r.value / invested) * 100)} %` : ""}{" "}
                  <span className="text-xs text-muted-foreground">{sek(r.value)}</span>
                </span>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
