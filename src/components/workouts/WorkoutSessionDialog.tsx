import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, History, Info, Plus, Timer, Trophy, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  fillLog,
  getExercise,
  planProgress,
  serializeDayPlan,
  type PlannedExercise,
  type SetLog,
} from "@/data/exercises";
import { ExerciseImage } from "./ExerciseImage";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";
import { Stepper } from "./Stepper";
import { bestBefore, formatSets, lastSessionBefore, type ExerciseHistory } from "@/data/workoutHistory";

const DEFAULT_REST_SECONDS = 90;

interface WorkoutSessionDialogProps {
  title: string;
  /** The workout day's date (yyyy-MM-dd) – earlier days count as history */
  date: string;
  history: ExerciseHistory;
  exercises: PlannedExercise[];
  /** Persist the plan (with logged sets) – called on every ticked set and when closing. */
  onSave: (exercises: string | null) => void;
  onClose: () => void;
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Mount with a `key` per day so state resets when another day is opened. */
export const WorkoutSessionDialog = ({
  title,
  date,
  history,
  exercises: initial,
  onSave,
  onClose,
}: WorkoutSessionDialogProps) => {
  const [exercises, setExercises] = useState<PlannedExercise[]>(() =>
    initial.map((p) => ({ ...p, log: fillLog(p) }))
  );
  const [current, setCurrent] = useState(() => {
    // Resume at the first exercise that isn't finished
    const idx = initial.findIndex((p) => fillLog(p).some((s) => !s.done));
    return idx === -1 ? 0 : idx;
  });
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [showEndImage, setShowEndImage] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const dirty = useRef(false);

  const progress = planProgress(exercises);
  const exercise = exercises[current];
  const def = exercise ? getExercise(exercise.exerciseId) : undefined;
  const log = exercise?.log ?? [];
  const last = exercise ? lastSessionBefore(history, exercise.exerciseId, date) : undefined;
  const best = exercise ? bestBefore(history, exercise.exerciseId, date) : { weight: 0, reps: 0 };

  const isRecord = (set: SetLog) =>
    set.done &&
    !!last && // only once there is something to beat
    (set.weight > 0 ? set.weight > best.weight : best.weight === 0 && set.reps > best.reps);

  // Alternate start/end photo so the movement is easy to see
  useEffect(() => {
    const id = setInterval(() => setShowEndImage((v) => !v), 1200);
    return () => clearInterval(id);
  }, []);

  // Rest timer
  useEffect(() => {
    if (restLeft === null) return;
    if (restLeft <= 0) {
      navigator.vibrate?.([200, 100, 200]);
      setRestLeft(null);
      return;
    }
    const id = setTimeout(() => setRestLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [restLeft]);

  const save = (next: PlannedExercise[]) => {
    dirty.current = false;
    onSave(serializeDayPlan(next));
  };

  const updateSet = (setIndex: number, patch: Partial<SetLog>, persist = false) => {
    const next = exercises.map((p, i) =>
      i === current ? { ...p, log: (p.log ?? []).map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) } : p
    );
    setExercises(next);
    if (persist) save(next);
    else dirty.current = true;
  };

  const toggleDone = (setIndex: number) => {
    const nowDone = !log[setIndex].done;
    updateSet(setIndex, { done: nowDone }, true);
    if (nowDone) setRestLeft(DEFAULT_REST_SECONDS);
  };

  /** Copy last session's reps & weight onto the sets not yet done */
  const applyLast = () => {
    if (!last) return;
    const next = exercises.map((p, i) =>
      i === current
        ? {
            ...p,
            log: (p.log ?? []).map((s, j) => {
              if (s.done) return s;
              const prev = last.sets[j] ?? last.sets[last.sets.length - 1];
              return { ...s, reps: prev.reps, weight: prev.weight };
            }),
          }
        : p
    );
    setExercises(next);
    dirty.current = true;
  };

  const addSet = () => {
    const last = log[log.length - 1] ?? { reps: exercise.reps, weight: exercise.weight };
    const next = exercises.map((p, i) =>
      i === current
        ? { ...p, sets: p.sets + 1, log: [...(p.log ?? []), { reps: last.reps, weight: last.weight, done: false }] }
        : p
    );
    setExercises(next);
    dirty.current = true;
  };

  const handleClose = () => {
    if (dirty.current) save(exercises);
    onClose();
  };

  const handleFinish = () => {
    save(exercises);
    // Exercises where a new best weight was hit today
    const records = exercises.filter((p) => {
      if (!lastSessionBefore(history, p.exerciseId, date)) return false;
      const prevBest = bestBefore(history, p.exerciseId, date).weight;
      return (p.log ?? []).some((s) => s.done && s.weight > 0 && s.weight > prevBest);
    }).length;
    toast({
      title: records > 0 ? `${records} ${records === 1 ? "nytt rekord" : "nya rekord"}! 🏆` : progress.complete ? "Bra jobbat! 💪" : "Passet sparat",
      description:
        `${progress.done}/${progress.total} set klara` +
        (progress.volume > 0 ? ` · ${Math.round(progress.volume).toLocaleString("sv-SE")} kg totalt` : ""),
    });
    onClose();
  };

  const exerciseDone = log.length > 0 && log.every((s) => s.done);
  const isLast = current === exercises.length - 1;

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-[560px] h-[95vh] sm:h-[90vh] flex flex-col gap-3 p-4 sm:p-6">
          <DialogHeader className="shrink-0 space-y-2">
            <DialogTitle className="text-base sm:text-lg pr-6">{title}</DialogTitle>
            <div className="flex items-center gap-3">
              <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                {progress.done}/{progress.total} set
              </span>
            </div>
          </DialogHeader>

          {/* Exercise strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 -mx-1 px-1">
            {exercises.map((p, i) => {
              const done = (p.log ?? []).every((s) => s.done);
              return (
                <button
                  key={`${p.exerciseId}-${i}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "relative shrink-0 rounded-md overflow-hidden border-2 transition-all",
                    i === current ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  aria-label={getExercise(p.exerciseId)?.name}
                >
                  <ExerciseImage exerciseId={p.exerciseId} className="h-12 w-12" />
                  {done && (
                    <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {exercise && (
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-3">
              <div className="relative">
                <ExerciseImage
                  exerciseId={exercise.exerciseId}
                  index={showEndImage ? 1 : 0}
                  className="w-full aspect-[16/10] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setDetailId(exercise.exerciseId)}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 hover:bg-background"
                  aria-label="Visa instruktioner"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Övning {current + 1} av {exercises.length}
                </p>
                <h3 className="text-lg font-semibold leading-tight">{def?.name ?? exercise.exerciseId}</h3>
                <p className="text-sm text-muted-foreground">
                  Mål: {exercise.sets} × {exercise.reps}
                  {exercise.weight > 0 && ` @ ${exercise.weight} kg`}
                </p>
              </div>

              {last && (
                <div className="rounded-lg bg-muted/60 p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-medium">
                      <History className="h-4 w-4 text-muted-foreground" />
                      Förra gången · {format(parseISO(last.date), "d MMM", { locale: sv })}
                    </p>
                    {log.some((s) => !s.done) && (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={applyLast}>
                        Använd samma
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground">{formatSets(last.sets)}</p>
                  {best.weight > 0 && (
                    <p className="text-xs text-muted-foreground">Rekord: {best.weight} kg</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {log.map((s, j) => (
                  <div
                    key={j}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border p-2 transition-colors",
                      s.done && "bg-green-600/10 border-green-600/40"
                    )}
                  >
                    <span className="w-10 text-sm font-medium text-muted-foreground flex flex-col leading-tight">
                      Set {j + 1}
                      {isRecord(s) && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                          <Trophy className="h-3 w-3" />
                          PR
                        </span>
                      )}
                    </span>
                    <Stepper value={s.reps} step={1} min={1} onChange={(v) => updateSet(j, { reps: v })} format={(v) => `${v} st`} />
                    <Stepper
                      value={s.weight}
                      step={2.5}
                      min={0}
                      onChange={(v) => updateSet(j, { weight: v })}
                      format={(v) => (v === 0 ? "–" : `${v} kg`)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant={s.done ? "default" : "outline"}
                      className={cn("h-10 w-10 rounded-full shrink-0", s.done && "bg-green-600 hover:bg-green-700")}
                      onClick={() => toggleDone(j)}
                      aria-label={s.done ? "Ångra set" : "Markera set som klart"}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={addSet}>
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till set
                </Button>
              </div>
            </div>
          )}

          {restLeft !== null && (
            <div className="shrink-0 flex items-center justify-between gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm">Vila</span>
                <span className="text-lg font-bold tabular-nums">{formatTime(restLeft)}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => setRestLeft((s) => Math.max(0, (s ?? 0) - 15))}>
                  −15
                </Button>
                <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => setRestLeft((s) => (s ?? 0) + 15)}>
                  +15
                </Button>
                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setRestLeft(null)} aria-label="Hoppa över vila">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="shrink-0 flex gap-2">
            <Button variant="outline" onClick={() => setCurrent((c) => c - 1)} disabled={current === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {isLast ? (
              <Button className="flex-1" onClick={handleFinish}>
                Avsluta pass
              </Button>
            ) : (
              <Button
                className="flex-1"
                variant={exerciseDone ? "default" : "secondary"}
                onClick={() => setCurrent((c) => c + 1)}
              >
                Nästa övning
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseDetailDialog exerciseId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
};
