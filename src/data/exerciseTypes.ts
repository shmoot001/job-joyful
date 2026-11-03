export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "cardio";

export interface ExerciseDefinition {
  id: string;
  name: string;
  group: MuscleGroup;
  equipment: string;
  primaryMuscles: string[];
  level: string;
  images: string[];
  instructions: string[];
  defaultSets: number;
  defaultReps: number;
}

/** What was actually done for one set during a workout. */
export interface SetLog {
  reps: number;
  weight: number;
  done: boolean;
}

/** One exercise as planned for a specific day. */
export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  /** Weight in kg, 0 = bodyweight / not set */
  weight: number;
  /** Optional planned weight per set (kg). When set, overrides `weight` for that set. */
  setWeights?: number[];
  /** Filled in during the workout, one entry per set */
  log?: SetLog[];
}

/** Stored as JSON in workout_days.exercises */
export interface DayPlan {
  version: 1;
  exercises: PlannedExercise[];
}
