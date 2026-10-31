import { useMemo, useRef, useState } from "react";
import { format, parseISO, subDays, subMonths, subYears } from "date-fns";
import { sv } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CalendarIcon, Camera, ImageIcon, Minus, Plus, Scale, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useBodyMeasurements, type BodyMeasurement } from "@/hooks/useBodyMeasurements";

type Range = "1m" | "3m" | "1y" | "all";
const RANGES: { id: Range; label: string }[] = [
  { id: "1m", label: "1 mån" },
  { id: "3m", label: "3 mån" },
  { id: "1y", label: "1 år" },
  { id: "all", label: "Allt" },
];

const kg = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} kg`;
const round1 = (n: number) => Math.round(n * 10) / 10;

const Change = ({ diff }: { diff: number }) => {
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {diff > 0 && "+"}
      {kg(round1(diff))}
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

const AddMeasurementDialog = ({
  lastWeight,
  onSave,
  onClose,
  isSaving,
}: {
  lastWeight: number | null;
  onSave: (data: { date: Date; weight: number | null; photo: File | null }) => void;
  onClose: () => void;
  isSaving: boolean;
}) => {
  const [date, setDate] = useState(new Date());
  const [logWeight, setLogWeight] = useState(true);
  const [weight, setWeight] = useState(lastWeight ?? 75);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (file: File | undefined) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const adjust = (delta: number) => setWeight((w) => Math.max(20, round1(w + delta)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logga kropp</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: sv })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  weekStartsOn={1}
                  locale={sv}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="logWeight">Kroppsvikt</Label>
              <Switch id="logWeight" checked={logWeight} onCheckedChange={setLogWeight} />
            </div>
            {logWeight && (
              <div className="flex items-center justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(-1)}>−1</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(-0.1)}>−0,1</Button>
                <div className="relative w-28">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="text-center text-xl font-semibold h-12 pr-8 tabular-nums"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(0.1)}>+0,1</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(1)}>+1</Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Progressbild (valfritt)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Förhandsvisning" className="w-full max-h-72 object-contain rounded-md bg-muted" />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => pickPhoto(undefined)}
                  aria-label="Ta bort bild"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full border-dashed h-20" onClick={() => fileRef.current?.click()}>
                <Camera className="h-5 w-5 mr-2" />
                Ta eller välj bild
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Bilderna är privata och syns bara för dig.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button
            disabled={isSaving || (!logWeight && !photo) || (logWeight && !(weight > 0))}
            onClick={() => {
              onSave({ date, weight: logWeight ? round1(weight) : null, photo });
              onClose();
            }}
          >
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BodyTracking = () => {
  const { measurements, isLoading, photoUrls, addMeasurement, isAdding, deleteMeasurement } = useBodyMeasurements();
  const [addOpen, setAddOpen] = useState(false);
  const [range, setRange] = useState<Range>("3m");
  const [viewPhoto, setViewPhoto] = useState<BodyMeasurement | null>(null);

  const weighIns = useMemo(() => measurements.filter((m) => m.weight !== null), [measurements]);
  const photos = useMemo(() => measurements.filter((m) => m.photo_path), [measurements]);

  const latest = weighIns[weighIns.length - 1];
  const first = weighIns[0];
  const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const baseline30 = [...weighIns].reverse().find((m) => m.date <= monthAgo) ?? first;

  const rangeStart =
    range === "1m" ? subMonths(new Date(), 1) : range === "3m" ? subMonths(new Date(), 3) : range === "1y" ? subYears(new Date(), 1) : null;
  const chartData = weighIns
    .filter((m) => !rangeStart || parseISO(m.date) >= rangeStart)
    .map((m) => ({ date: m.date, label: format(parseISO(m.date), "d MMM", { locale: sv }), weight: m.weight }));

  const chartConfig = { weight: { label: "Kroppsvikt", color: "hsl(var(--primary))" } } satisfies ChartConfig;

  if (isLoading) return <p className="text-center py-12 text-muted-foreground">Laddar…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Kropp</h2>
          <p className="text-sm text-muted-foreground">Kroppsvikt och progressbilder</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Logga
        </Button>
      </div>

      {measurements.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Inga mätningar än</h3>
          <p className="text-muted-foreground">Logga din vikt eller ta en progressbild för att börja följa din utveckling.</p>
        </div>
      ) : (
        <>
          {latest && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label="Nuvarande" value={kg(latest.weight!)} sub={<span className="text-xs text-muted-foreground">{format(parseISO(latest.date), "d MMM", { locale: sv })}</span>} />
              <Tile label="Senaste 30 dagar" value={`${latest.weight! - baseline30.weight! > 0 ? "+" : ""}${kg(round1(latest.weight! - baseline30.weight!))}`} />
              <Tile label="Sedan start" value={`${latest.weight! - first.weight! > 0 ? "+" : ""}${kg(round1(latest.weight! - first.weight!))}`} sub={<span className="text-xs text-muted-foreground">sedan {format(parseISO(first.date), "d MMM yyyy", { locale: sv })}</span>} />
              <Tile label="Lägsta / högsta" value={`${kg(Math.min(...weighIns.map((m) => m.weight!)))}`} sub={<span className="text-xs text-muted-foreground">högsta {kg(Math.max(...weighIns.map((m) => m.weight!)))}</span>} />
            </div>
          )}

          {weighIns.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
                <CardTitle className="text-base">Kroppsvikt</CardTitle>
                <div className="flex gap-1">
                  {RANGES.map((r) => (
                    <Button key={r.id} size="sm" variant={range === r.id ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setRange(r.id)}>
                      {r.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} width={44} domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(v: number) => String(Math.round(v))} />
                      <ChartTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{kg(Number(value))}</span>} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-weight)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "var(--color-weight)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Inga mätningar i vald period.</p>
                )}
              </CardContent>
            </Card>
          )}

          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progressbilder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {photos.length > 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {[photos[0], photos[photos.length - 1]].map((m, i) => (
                      <div key={m.id} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {i === 0 ? "Första" : "Senaste"} · {format(parseISO(m.date), "d MMM yyyy", { locale: sv })}
                          {m.weight !== null && ` · ${kg(m.weight)}`}
                        </p>
                        {photoUrls[m.photo_path!] ? (
                          <img src={photoUrls[m.photo_path!]} alt="" className="w-full aspect-[3/4] object-cover rounded-md bg-muted" />
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-md bg-muted" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[...photos].reverse().map((m) => (
                    <button key={m.id} type="button" onClick={() => setViewPhoto(m)} className="relative rounded-md overflow-hidden bg-muted aspect-[3/4]">
                      {photoUrls[m.photo_path!] ? (
                        <img src={photoUrls[m.photo_path!]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 m-auto text-muted-foreground absolute inset-0" />
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-0.5 text-center">
                        {format(parseISO(m.date), "d MMM", { locale: sv })}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[...measurements].reverse().map((m, i, arr) => {
                const prevWeighIn = arr.slice(i + 1).find((x) => x.weight !== null);
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className="w-24 text-sm">{format(parseISO(m.date), "d MMM yyyy", { locale: sv })}</span>
                    <span className="flex-1 text-sm font-medium tabular-nums">
                      {m.weight !== null ? kg(m.weight) : "–"}{" "}
                      {m.weight !== null && prevWeighIn?.weight != null && <Change diff={m.weight - prevWeighIn.weight} />}
                    </span>
                    {m.photo_path && <Camera className="h-4 w-4 text-muted-foreground" />}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      aria-label="Ta bort"
                      onClick={() => confirm("Ta bort mätningen?") && deleteMeasurement(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {addOpen && (
        <AddMeasurementDialog
          lastWeight={latest?.weight ?? null}
          isSaving={isAdding}
          onClose={() => setAddOpen(false)}
          onSave={(d) => addMeasurement(d)}
        />
      )}

      <Dialog open={!!viewPhoto} onOpenChange={(o) => !o && setViewPhoto(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {viewPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {format(parseISO(viewPhoto.date), "d MMMM yyyy", { locale: sv })}
                  {viewPhoto.weight !== null && ` · ${kg(viewPhoto.weight)}`}
                </DialogTitle>
              </DialogHeader>
              {photoUrls[viewPhoto.photo_path!] && (
                <img src={photoUrls[viewPhoto.photo_path!]} alt="" className={cn("w-full max-h-[75vh] object-contain rounded-md")} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
