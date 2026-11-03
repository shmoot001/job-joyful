import { EXERCISES } from "./exerciseLibrary";
import type { DayPlan, ExerciseDefinition, MuscleGroup, PlannedExercise, SetLog } from "./exerciseTypes";

export { EXERCISES };
export type { DayPlan, ExerciseDefinition, MuscleGroup, PlannedExercise, SetLog };

const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export const exerciseImageUrl = (path: string) => IMAGE_BASE + path;

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string }[] = [
  { id: "chest", label: "Bröst" },
  { id: "back", label: "Rygg" },
  { id: "legs", label: "Ben" },
  { id: "shoulders", label: "Axlar" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "forearms", label: "Underarmar" },
  { id: "core", label: "Mage" },
  { id: "cardio", label: "Kondition" },
];

export const muscleGroupLabel = (id: MuscleGroup) =>
  MUSCLE_GROUPS.find((g) => g.id === id)?.label ?? id;

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Skivstång",
  dumbbell: "Hantlar",
  cable: "Kabel",
  machine: "Maskin",
  "body only": "Kroppsvikt",
  kettlebells: "Kettlebell",
  "e-z curl bar": "EZ-stång",
  other: "Övrigt",
  bands: "Gummiband",
  "exercise ball": "Pilatesboll",
  "medicine ball": "Medicinboll",
  "foam roll": "Foam roller",
};

export const equipmentLabel = (e: string) => EQUIPMENT_LABELS[e] ?? e;

const byId = new Map(EXERCISES.map((e) => [e.id, e]));
export const getExercise = (id: string): ExerciseDefinition | undefined => byId.get(id);

/** Ready-made quick picks for the day's focus, so nothing has to be typed. */
export const BODY_PART_PRESETS = [
  "Bröst & Triceps",
  "Rygg & Biceps",
  "Ben",
  "Axlar",
  "Armar",
  "Överkropp",
  "Underkropp",
  "Push",
  "Pull",
  "Helkropp",
  "Mage",
  "Kondition",
];

/**
 * Parses workout_days.exercises. New plans are stored as JSON; older rows
 * contain free text, which is returned as `legacyText` so it isn't lost.
 */
export const parseDayPlan = (
  raw: string | null | undefined
): { plan: DayPlan; legacyText: string } => {
  const empty: DayPlan = { version: 1, exercises: [] };
  if (!raw) return { plan: empty, legacyText: "" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.exercises)) {
      return { plan: parsed as DayPlan, legacyText: "" };
    }
  } catch {
    // not JSON – legacy free text
  }
  return { plan: empty, legacyText: raw };
};

export const serializeDayPlan = (exercises: PlannedExercise[]): string | null =>
  exercises.length ? JSON.stringify({ version: 1, exercises } satisfies DayPlan) : null;

/** Derive a focus label (e.g. "Bröst & Triceps") from the chosen exercises. */
export const deriveBodyPart = (exercises: PlannedExercise[]): string => {
  const groups: MuscleGroup[] = [];
  for (const p of exercises) {
    const g = getExercise(p.exerciseId)?.group;
    if (g && !groups.includes(g)) groups.push(g);
  }
  return groups.map(muscleGroupLabel).join(" & ");
};

/** Planned weight for a given set (per-set weight if set, otherwise the common weight). */
export const plannedWeight = (p: PlannedExercise, setIndex: number): number =>
  p.setWeights?.[setIndex] ?? p.weight;

/** Planned weights for all sets, e.g. [40, 50, 60]. */
export const plannedWeights = (p: PlannedExercise): number[] =>
  Array.from({ length: p.sets }, (_, i) => plannedWeight(p, i));

/** Short text for the planned weight: "60 kg", "40–60 kg" or "" for bodyweight. */
export const plannedWeightLabel = (p: PlannedExercise): string => {
  const ws = plannedWeights(p);
  const min = Math.min(...ws);
  const max = Math.max(...ws);
  if (max === 0) return "";
  return min === max ? `${max} kg` : `${ws.map((w) => (w === 0 ? "–" : w)).join(" / ")} kg`;
};

/** Log rows for every planned set, keeping what's already been logged. */
export const fillLog = (p: PlannedExercise): SetLog[] =>
  Array.from({ length: p.sets }, (_, i) => p.log?.[i] ?? { reps: p.reps, weight: plannedWeight(p, i), done: false });

export const planProgress = (exercises: PlannedExercise[]) => {
  let done = 0;
  let total = 0;
  let volume = 0;
  for (const p of exercises) {
    total += p.sets;
    for (const s of fillLog(p)) {
      if (s.done) {
        done++;
        volume += s.reps * s.weight;
      }
    }
  }
  return { done, total, volume, complete: total > 0 && done === total };
};

/** Same plan with all logged sets removed (e.g. when copying a week). */
export const clearPlanLogs = (raw: string | null): string | null => {
  const { plan, legacyText } = parseDayPlan(raw);
  if (!plan.exercises.length) return legacyText || null;
  return serializeDayPlan(plan.exercises.map(({ log: _log, ...rest }) => rest));
};
