import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronDown, ChevronUp, Info, Plus, Trash2 } from "lucide-react";
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
}

/** Mount with a `key` per day so state resets when another day is opened. */
export const WorkoutDayDialog = ({ day, onClose, onSave, isUpdating }: WorkoutDayDialogProps) => {
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

  const remove = (index: number) => setPlanned((prev) => prev.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) =>
    setPlanned((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = () => {
    // Keep legacy free text if the user hasn't moved to the new picker yet
    const exercises = planned.length ? serializeDayPlan(planned) : legacyText || null;
    onSave({
      bodyPart: isRestDay ? "" : bodyPart || autoBodyPart,
      exercises: isRestDay ? null : exercises,
      notes,
      isRestDay,
    });
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
                                <Stepper label="Set" value={p.sets} step={1} min={1} onChange={(v) => update(i, { sets: v })} />
                                <Stepper label="Reps" value={p.reps} step={1} min={1} onChange={(v) => update(i, { reps: v })} />
                                <Stepper
                                  label="Vikt"
                                  value={p.weight}
                                  step={2.5}
                                  min={0}
                                  onChange={(v) => update(i, { weight: v })}
                                  format={(v) => (v === 0 ? "–" : `${v} kg`)}
                                />
                              </div>
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
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Anteckningar (valfritt)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
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
    </>
  );
};
