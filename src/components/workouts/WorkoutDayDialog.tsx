import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronDown, ChevronUp, Copy, History, Info, Plus, Trash2 } from "lucide-react";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BODY_PART_PRESETS,
  deriveBodyPart,
  getExercise,
  parseDayPlan,
  serializeDayPlan,
  type PlannedExercise,
} from "@/data/exercises";
import { ExerciseImage } from "./ExerciseImage";
import { Stepper } from "./Stepper";
import { ExercisePickerDialog } from "./ExercisePickerDialog";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";
import { CopyDayDialog } from "./CopyDayDialog";
import { RepeatSessionDialog, type PastDay } from "./RepeatSessionDialog";

export interface EditingDay {
  weekId: string;
  dayOfWeek: number;
  date: Date;
  bodyPart: string;
  exercises: string;
  notes: string;
  isRestDay: boolean;
}

export interface SaveDayData {
  bodyPart: string;
  exercises: string | null;
  notes: string;
  isRestDay: boolean;
}

const DAY_NAMES = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

interface WorkoutDayDialogProps {
  day: EditingDay;
  onClose: () => void;
  onSave: (data: SaveDayData) => void;
  isUpdating: boolean;
  /** Earlier planned days, for "repeat an earlier session" */
  pastDays?: PastDay[];
  /** Copy the day as currently edited to another date */
  onCopyTo?: (data: SaveDayData, target: Date) => void;
}

/** Mount with a `key` per day so state resets when another day is opened. */
export const WorkoutDayDialog = ({
  day,
  onClose,
  onSave,
  isUpdating,
  pastDays = [],
  onCopyTo,
}: WorkoutDayDialogProps) => {
  const initial = parseDayPlan(day.exercises);
  const [planned, setPlanned] = useState<PlannedExercise[]>(initial.plan.exercises);
  const [legacyText, setLegacyText] = useState(initial.legacyText);
  // "" means "auto" – derived from the chosen exercises
  const [bodyPart, setBodyPart] = useState(
    day.bodyPart === deriveBodyPart(initial.plan.exercises) ? "" : day.bodyPart
  );
  const [notes, setNotes] = useState(day.notes);
  const [isRestDay, setIsRestDay] = useState(day.isRestDay);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  const autoBodyPart = deriveBodyPart(planned);
  const totalSets = planned.reduce((sum, p) => sum + p.sets, 0);

  const addExercises = (ids: string[]) => {
    const toAdd = ids
      .map((id) => getExercise(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ({ exerciseId: e.id, sets: e.defaultSets, reps: e.defaultReps, weight: 0 }));
    setPlanned((prev) => [...prev, ...toAdd]);
  };

  const update = (index: number, patch: Partial<PlannedExercise>) =>
    setPlanned((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  /** Change the number of sets, keeping per-set weights in sync. */
  const setSets = (index: number, sets: number) =>
    setPlanned((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        if (!p.setWeights) return { ...p, sets };
        const last = p.setWeights[p.setWeights.length - 1] ?? p.weight;
        const setWeights = Array.from({ length: sets }, (_, j) => p.setWeights?.[j] ?? last);
        return { ...p, sets, setWeights };
      })
    );

  const togglePerSetWeights = (index: number) =>
    setPlanned((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        if (p.setWeights) {
          const { setWeights, ...rest } = p;
          return { ...rest, weight: Math.max(0, ...setWeights) };
        }
        return { ...p, setWeights: Array(p.sets).fill(p.weight) };
      })
    );

  const updateSetWeight = (index: number, setIndex: number, weight: number) =>
    setPlanned((prev) =>
      prev.map((p, i) => {
        if (i !== index || !p.setWeights) return p;
        const setWeights = p.setWeights.map((w, j) => (j === setIndex ? weight : w));
        return { ...p, setWeights, weight: Math.max(0, ...setWeights) };
      })
    );

  const remove = (index: number) => setPlanned((prev) => prev.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) =>
    setPlanned((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const buildData = (): SaveDayData => {
    // Keep legacy free text if the user hasn't moved to the new picker yet
    const exercises = planned.length ? serializeDayPlan(planned) : legacyText || null;
    return {
      bodyPart: isRestDay ? "" : bodyPart || autoBodyPart,
      exercises: isRestDay ? null : exercises,
      notes,
      isRestDay,
    };
  };

  const handleSave = () => onSave(buildData());

  const repeatSession = (past: PastDay) => {
    setPlanned(past.exercises);
    setBodyPart(past.bodyPart && past.bodyPart !== deriveBodyPart(past.exercises) ? past.bodyPart : "");
    setLegacyText("");
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {DAY_NAMES[day.dayOfWeek]} – {format(day.date, "d MMM", { locale: sv })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="restDay" className="cursor-pointer">
                Vilodag
              </Label>
              <Switch id="restDay" checked={isRestDay} onCheckedChange={setIsRestDay} />
            </div>

            {!isRestDay && (
              <>
                <div className="space-y-2">
                  <Label>Fokus</Label>
                  <div className="flex flex-wrap gap-2">
                    {autoBodyPart && (
                      <Button
                        type="button"
                        size="sm"
                        variant={bodyPart === "" ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setBodyPart("")}
                      >
                        {autoBodyPart} (auto)
                      </Button>
                    )}
                    {bodyPart && !BODY_PART_PRESETS.includes(bodyPart) && (
                      <Button type="button" size="sm" className="rounded-full" onClick={() => setBodyPart("")}>
                        {bodyPart}
                      </Button>
                    )}
                    {BODY_PART_PRESETS.map((p) => (
                      <Button
                        key={p}
                        type="button"
                        size="sm"
                        variant={bodyPart === p ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setBodyPart(bodyPart === p ? "" : p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Övningar</Label>
                    {planned.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {planned.length} övningar · {totalSets} set
                      </span>
                    )}
                  </div>

                  {planned.length === 0 && legacyText && (
                    <div className="rounded-lg border border-dashed p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Tidigare anteckning (gammalt format):</p>
                      <p className="whitespace-pre-wrap">{legacyText}</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="px-0 h-auto mt-1 text-destructive"
                        onClick={() => setLegacyText("")}
                      >
                        Ta bort
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {planned.map((p, i) => {
                      const ex = getExercise(p.exerciseId);
                      return (
                        <div key={`${p.exerciseId}-${i}`} className="rounded-lg border p-2 sm:p-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setDetailId(p.exerciseId)}
                              className="relative shrink-0"
                              aria-label="Visa instruktioner"
                            >
                              <ExerciseImage exerciseId={p.exerciseId} className="h-16 w-16 rounded-md" />
                              <Info className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-background/80 p-0.5" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm leading-tight">
                                  <span className="text-muted-foreground mr-1">{i + 1}.</span>
                                  {ex?.name ?? p.exerciseId}
                                </p>
                                <div className="flex shrink-0">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => move(i, -1)}
                                    disabled={i === 0}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => move(i, 1)}
                                    disabled={i === planned.length - 1}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => remove(i)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                <Stepper label="Set" value={p.sets} step={1} min={1} onChange={(v) => setSets(i, v)} />
                                <Stepper label="Reps" value={p.reps} step={1} min={1} onChange={(v) => update(i, { reps: v })} />
                                {!p.setWeights && (
                                  <Stepper
                                    label="Vikt"
                                    value={p.weight}
                                    step={2.5}
                                    min={0}
                                    onChange={(v) => update(i, { weight: v })}
                                    format={(v) => (v === 0 ? "–" : `${v} kg`)}
                                  />
                                )}
                              </div>
                              {p.setWeights && (
                                <div className="mt-2 space-y-1.5 rounded-md bg-muted/40 p-2">
                                  {p.setWeights.map((w, j) => (
                                    <div key={j} className="flex items-center justify-between gap-2">
                                      <span className="text-xs text-muted-foreground">Set {j + 1}</span>
                                      <Stepper
                                        value={w}
                                        step={2.5}
                                        min={0}
                                        onChange={(v) => updateSetWeight(i, j, v)}
                                        format={(v) => (v === 0 ? "–" : `${v} kg`)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="px-0 h-auto mt-1 text-xs"
                                onClick={() => togglePerSetWeights(i)}
                              >
                                {p.setWeights ? "Samma vikt för alla set" : "Olika vikt per set"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setPickerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till övningar
                  </Button>
                  {pastDays.length > 0 && (
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setRepeatOpen(true)}>
                      <History className="h-4 w-4 mr-2" />
                      Upprepa tidigare pass
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Anteckningar (valfritt)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              {onCopyTo && (
                <Button variant="ghost" className="mr-auto" onClick={() => setCopyOpen(true)}>
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Kopiera till…</span>
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExercisePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercises}
        alreadyPlanned={planned.map((p) => p.exerciseId)}
      />
      <ExerciseDetailDialog exerciseId={detailId} onClose={() => setDetailId(null)} />
      {copyOpen && onCopyTo && (
        <CopyDayDialog
          sourceDate={day.date}
          onClose={() => setCopyOpen(false)}
          onCopy={(target) => onCopyTo(buildData(), target)}
        />
      )}
      {repeatOpen && (
        <RepeatSessionDialog
          days={pastDays.filter((d) => parseISO(d.date).getTime() !== day.date.getTime())}
          onClose={() => setRepeatOpen(false)}
          onPick={repeatSession}
        />
      )}
    </>
  );
};
