import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, LineChart as LineChartIcon, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getExercise, muscleGroupLabel } from "@/data/exercises";
import { formatSets, round1, type ExerciseHistory, type HistoryEntry } from "@/data/workoutHistory";
import { ExerciseImage } from "./ExerciseImage";

type Metric = "topWeight" | "est1RM" | "volume" | "maxReps";

const METRICS: { id: Metric; label: string; unit: string; needsWeight: boolean }[] = [
  { id: "topWeight", label: "Max vikt", unit: "kg", needsWeight: true },
  { id: "est1RM", label: "Uppskattat 1RM", unit: "kg", needsWeight: true },
  { id: "volume", label: "Volym", unit: "kg", needsWeight: true },
  { id: "maxReps", label: "Max reps", unit: "st", needsWeight: false },
];

const fmtNum = (n: number) => round1(n).toLocaleString("sv-SE");

const Trend = ({ diff, unit }: { diff: number; unit: string }) => {
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {diff > 0 && "+"}
      {fmtNum(diff)} {unit}
    </span>
  );
};

const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p>
    {sub && <div className="mt-0.5">{sub}</div>}
  </div>
);

export const WorkoutProgress = ({ history }: { history: ExerciseHistory }) => {
  // Exercises with history, most recently trained first
  const exercises = useMemo(
    () =>
      [...history.entries()]
        .map(([id, entries]) => ({ id, entries, lastDate: entries[entries.length - 1].date }))
        .sort((a, b) => b.lastDate.localeCompare(a.lastDate)),
    [history]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metricChoice, setMetricChoice] = useState<Metric | null>(null);

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <LineChartIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Inga framsteg än</h3>
        <p className="text-muted-foreground">
          Starta ett pass och bocka av dina set – då dyker din utveckling upp här.
        </p>
      </div>
    );
  }

  const selected = exercises.find((e) => e.id === selectedId) ?? exercises[0];
  const entries: HistoryEntry[] = selected.entries;
  const def = getExercise(selected.id);
  const usesWeight = entries.some((e) => e.topWeight > 0);
  const availableMetrics = METRICS.filter((m) => usesWeight || !m.needsWeight);
  const metric =
    metricChoice && availableMetrics.some((m) => m.id === metricChoice)
      ? metricChoice
      : availableMetrics[0].id;
  const metricDef = METRICS.find((m) => m.id === metric)!;

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const mainKey: Metric = usesWeight ? "topWeight" : "maxReps";
  const mainUnit = usesWeight ? "kg" : "st";
  const record = Math.max(...entries.map((e) => e[mainKey]));

  const chartData = entries.map((e) => ({
    date: e.date,
    label: format(parseISO(e.date), "d MMM", { locale: sv }),
    value: round1(e[metric]),
  }));

  const chartConfig = {
    value: { label: metricDef.label, color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Exercise selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {exercises.map(({ id, entries: es }) => {
          const ex = getExercise(id);
          const w = es.some((e) => e.topWeight > 0);
          const last = es[es.length - 1];
          const prev = es[es.length - 2];
          const key: Metric = w ? "topWeight" : "maxReps";
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedId(id)}
              className={cn(
                "shrink-0 w-36 rounded-lg border overflow-hidden text-left transition-all hover:shadow-md",
                id === selected.id && "ring-2 ring-primary border-primary"
              )}
            >
              <ExerciseImage exerciseId={id} className="w-full h-20" />
              <div className="p-2">
                <p className="text-xs font-medium leading-tight line-clamp-2 min-h-[2rem]">{ex?.name ?? id}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {fmtNum(last[key])} {w ? "kg" : "st"}
                  </span>
                  {prev && <Trend diff={last[key] - prev[key]} unit="" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <ExerciseImage exerciseId={selected.id} className="h-14 w-14 rounded-md shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-lg leading-tight">{def?.name ?? selected.id}</CardTitle>
            {def && <p className="text-sm text-muted-foreground">{muscleGroupLabel(def.group)}</p>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Senaste"
              value={`${fmtNum(latest[mainKey])} ${mainUnit}`}
              sub={previous && <Trend diff={latest[mainKey] - previous[mainKey]} unit={mainUnit} />}
            />
            <StatTile label="Rekord" value={`${fmtNum(record)} ${mainUnit}`} />
            <StatTile
              label="Sedan start"
              value={`${latest[mainKey] - first[mainKey] > 0 ? "+" : ""}${fmtNum(latest[mainKey] - first[mainKey])} ${mainUnit}`}
              sub={<span className="text-xs text-muted-foreground">sedan {format(parseISO(first.date), "d MMM", { locale: sv })}</span>}
            />
            <StatTile label="Antal pass" value={String(entries.length)} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  variant={metric === m.id ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setMetricChoice(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>

            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v: number) => `${fmtNum(v)}`}
                  domain={["auto", "auto"]}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium tabular-nums">
                          {metricDef.label}: {fmtNum(Number(value))} {metricDef.unit}
                        </span>
                      )}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-value)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
            {entries.length < 2 && (
              <p className="text-xs text-muted-foreground text-center">Logga fler pass för att se en trend.</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Historik</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Set</TableHead>
                  <TableHead className="text-right">{usesWeight ? "Max" : "Max reps"}</TableHead>
                  {usesWeight && <TableHead className="text-right hidden sm:table-cell">Volym</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...entries].reverse().map((e) => (
                  <TableRow key={e.date}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(e.date), "d MMM yyyy", { locale: sv })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatSets(e.sets)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {usesWeight ? `${fmtNum(e.topWeight)} kg` : e.maxReps}
                    </TableCell>
                    {usesWeight && (
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {fmtNum(e.volume)} kg
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
