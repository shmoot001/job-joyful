import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { planProgress, type PlannedExercise } from "@/data/exercises";
import { ExerciseImage } from "./ExerciseImage";

export interface PastDay {
  date: string; // yyyy-MM-dd
  bodyPart: string | null;
  exercises: PlannedExercise[];
}

/**
 * Plan copied from an earlier day. Where sets were logged, the heaviest
 * completed weight becomes the new target so you pick up where you left off.
 */
const toFreshPlan = (exercises: PlannedExercise[]): PlannedExercise[] =>
  exercises.map(({ log, ...p }) => {
    const done = (log ?? []).filter((s) => s.done);
    const topWeight = done.reduce((max, s) => Math.max(max, s.weight), 0);
    if (topWeight === 0) return p;
    // Keep per-set weights if the sets were done with different weights
    const weights = Array.from({ length: p.sets }, (_, i) =>
      log?.[i]?.done ? log[i].weight : p.setWeights?.[i] ?? p.weight
    );
    const varied = weights.some((w) => w !== weights[0]);
    return varied
      ? { ...p, weight: topWeight, setWeights: weights }
      : { ...p, weight: topWeight, setWeights: undefined };
  });

export const RepeatSessionDialog = ({
  days,
  onPick,
  onClose,
}: {
  days: PastDay[];
  onPick: (day: PastDay) => void;
  onClose: () => void;
}) => {
  const [focus, setFocus] = useState<string | null>(null);

  // Most common focuses as quick filters
  const focuses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of days) if (d.bodyPart) counts.set(d.bodyPart, (counts.get(d.bodyPart) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f]) => f);
  }, [days]);

  const shown = days.filter((d) => !focus || d.bodyPart === focus).slice(0, 30);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upprepa tidigare pass</DialogTitle>
        </DialogHeader>

        {focuses.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            <Button size="sm" variant={focus === null ? "default" : "outline"} className="rounded-full shrink-0" onClick={() => setFocus(null)}>
              Alla
            </Button>
            {focuses.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={focus === f ? "default" : "outline"}
                className="rounded-full shrink-0"
                onClick={() => setFocus(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {shown.map((d) => {
            const progress = planProgress(d.exercises);
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  onPick({ ...d, exercises: toFreshPlan(d.exercises) });
                  onClose();
                }}
                className="w-full flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex -space-x-2 shrink-0">
                  {d.exercises.slice(0, 3).map((p, i) => (
                    <ExerciseImage key={i} exerciseId={p.exerciseId} className="h-9 w-9 rounded-full border-2 border-background" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.bodyPart || `${d.exercises.length} övningar`}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(parseISO(d.date), "EEEE d MMM", { locale: sv })} · {d.exercises.length} övn · {progress.total} set
                  </p>
                </div>
                {progress.done > 0 && (
                  <CheckCircle2 className={progress.complete ? "h-4 w-4 text-green-600 shrink-0" : "h-4 w-4 text-muted-foreground shrink-0"} />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
