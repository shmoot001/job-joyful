import { useState } from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS } from "@/data/exercises";
import type { WeekStats } from "@/data/weeklyStats";

const fmt = (n: number) => Math.round(n).toLocaleString("sv-SE");

const Delta = ({ now, before }: { now: number; before?: number }) => {
  if (before === undefined || before === 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-xs text-muted-foreground">± 0 % mot förra veckan</span>;
  const up = pct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-green-600" : "text-red-600")}>
      <Icon className="h-3 w-3" />
      {up && "+"}
      {pct} % mot förra veckan
    </span>
  );
};

const Tile = ({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p>
    {sub && <div className="mt-0.5">{sub}</div>}
  </div>
);

export const WeeklySummary = ({ weeks }: { weeks: WeekStats[] }) => {
  const currentMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [index, setIndex] = useState(() => {
    // Default: this week, otherwise the most recent week that isn't in the future
    const i = weeks.findIndex((w) => w.weekStart <= currentMonday);
    return i === -1 ? 0 : i;
  });

  if (weeks.length === 0) return null;
  const safeIndex = Math.min(index, weeks.length - 1);
  const week = weeks[safeIndex];
  const prev = weeks[safeIndex + 1];
  const start = parseISO(week.weekStart);

  const maxSets = Math.max(1, ...MUSCLE_GROUPS.map((g) => Math.max(week.groups[g.id].planned, week.groups[g.id].done)));
  const neglected = MUSCLE_GROUPS.filter((g) => g.id !== "cardio" && week.groups[g.id].planned === 0 && week.groups[g.id].done === 0);

  // Volume for the last 8 weeks, oldest → newest
  const trend = weeks
    .slice(safeIndex, safeIndex + 8)
    .reverse()
    .map((w) => ({ id: w.weekId, label: `v${w.weekNumber}`, volume: Math.round(w.volume), sets: w.doneSets }));

  const chartConfig = { volume: { label: "Volym (kg)", color: "hsl(var(--primary))" } } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <div>
          <CardTitle className="text-lg">Veckoöversikt</CardTitle>
          <p className="text-sm text-muted-foreground">
            Vecka {week.weekNumber} · {format(start, "d MMM", { locale: sv })} – {format(addDays(start, 6), "d MMM", { locale: sv })}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIndex(safeIndex + 1)} disabled={!prev} aria-label="Föregående vecka">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIndex(safeIndex - 1)} disabled={safeIndex === 0} aria-label="Nästa vecka">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Pass" value={`${week.completedSessions} / ${week.plannedSessions}`} sub={<span className="text-xs text-muted-foreground">genomförda / planerade</span>} />
          <Tile label="Set klara" value={`${week.doneSets} / ${week.plannedSets}`} sub={<Delta now={week.doneSets} before={prev?.doneSets} />} />
          <Tile label="Total volym" value={`${fmt(week.volume)} kg`} sub={<Delta now={week.volume} before={prev?.volume} />} />
          <Tile
            label="Muskelgrupper"
            value={`${MUSCLE_GROUPS.filter((g) => week.groups[g.id].done > 0).length} / ${MUSCLE_GROUPS.length}`}
            sub={<span className="text-xs text-muted-foreground">tränade</span>}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Set per muskelgrupp</h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Klart
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> Planerat
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {MUSCLE_GROUPS.map((g) => {
              const { planned, done } = week.groups[g.id];
              const empty = planned === 0 && done === 0;
              return (
                <div key={g.id} className="flex items-center gap-3" title={`${g.label}: ${done} av ${planned} set klara`}>
                  <span className="w-20 shrink-0 text-sm">{g.label}</span>
                  <div className="relative flex-1 h-5 rounded bg-muted/40 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-r bg-primary/20" style={{ width: `${(planned / maxSets) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-r bg-primary" style={{ width: `${(done / maxSets) * 100}%` }} />
                  </div>
                  <span className={cn("w-16 shrink-0 text-right text-sm tabular-nums", empty && "text-muted-foreground")}>
                    {empty ? "Ej tränad" : `${done}/${planned}`}
                  </span>
                </div>
              );
            })}
          </div>
          {neglected.length > 0 && week.plannedSessions > 0 && (
            <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-500 bg-amber-500/10 rounded-md p-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Ingen träning denna vecka för: {neglected.map((g) => g.label).join(", ")}
            </p>
          )}
        </div>

        {trend.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Volym per vecka (kg)</h4>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => fmt(v)} />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.3 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span className="tabular-nums">
                          {fmt(Number(value))} kg · {item.payload.sets} set
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {trend.map((t) => (
                    <Cell key={t.id} fill="var(--color-volume)" fillOpacity={t.id === week.weekId ? 1 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
