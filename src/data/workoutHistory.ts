import { fillLog, parseDayPlan, type SetLog } from "./exercises";

/** One day's logged result for one exercise (only sets marked done count). */
export interface HistoryEntry {
  date: string; // yyyy-MM-dd
  sets: SetLog[];
  topWeight: number;
  /** Reps done at the top weight */
  topReps: number;
  maxReps: number;
  volume: number;
  /** Estimated one-rep max (Epley), 0 for bodyweight */
  est1RM: number;
}

export type ExerciseHistory = Map<string, HistoryEntry[]>;

interface DayLike {
  date: string;
  exercises: string | null;
  is_rest_day?: boolean | null;
}

const epley = (weight: number, reps: number) => (weight > 0 ? weight * (1 + reps / 30) : 0);

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Build per-exercise history (oldest → newest) from all workout days. */
export const buildExerciseHistory = (days: DayLike[]): ExerciseHistory => {
  const history: ExerciseHistory = new Map();

  for (const day of days) {
    if (day.is_rest_day) continue;
    const { plan } = parseDayPlan(day.exercises);

    // Merge if the same exercise appears twice on one day
    const perDay = new Map<string, SetLog[]>();
    for (const p of plan.exercises) {
      const done = fillLog(p).filter((s) => s.done);
      if (done.length) perDay.set(p.exerciseId, [...(perDay.get(p.exerciseId) ?? []), ...done]);
    }

    for (const [exerciseId, sets] of perDay) {
      let topWeight = 0;
      let topReps = 0;
      let maxReps = 0;
      let volume = 0;
      let est1RM = 0;
      for (const s of sets) {
        if (s.weight > topWeight || (s.weight === topWeight && s.reps > topReps)) {
          topWeight = s.weight;
          topReps = s.reps;
        }
        maxReps = Math.max(maxReps, s.reps);
        volume += s.weight * s.reps;
        est1RM = Math.max(est1RM, epley(s.weight, s.reps));
      }
      const entry: HistoryEntry = { date: day.date, sets, topWeight, topReps, maxReps, volume, est1RM: round1(est1RM) };
      history.set(exerciseId, [...(history.get(exerciseId) ?? []), entry]);
    }
  }

  for (const entries of history.values()) entries.sort((a, b) => a.date.localeCompare(b.date));
  return history;
};

/** Most recent session strictly before `date`. */
export const lastSessionBefore = (history: ExerciseHistory, exerciseId: string, date: string) => {
  const entries = history.get(exerciseId) ?? [];
  for (let i = entries.length - 1; i >= 0; i--) if (entries[i].date < date) return entries[i];
  return undefined;
};

/** Best weight (and reps) ever lifted strictly before `date`. */
export const bestBefore = (history: ExerciseHistory, exerciseId: string, date: string) => {
  let weight = 0;
  let reps = 0;
  for (const e of history.get(exerciseId) ?? []) {
    if (e.date >= date) continue;
    weight = Math.max(weight, e.topWeight);
    reps = Math.max(reps, e.maxReps);
  }
  return { weight, reps };
};

export const formatSets = (sets: SetLog[]) =>
  sets.map((s) => (s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps} st`)).join(", ");
