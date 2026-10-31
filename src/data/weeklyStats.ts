import { fillLog, getExercise, MUSCLE_GROUPS, parseDayPlan, type MuscleGroup } from "./exercises";

interface WeekLike {
  id: string;
  week_start_date: string;
  week_number: number;
  year: number;
  workout_days?: { date: string; exercises: string | null; is_rest_day: boolean | null }[] | null;
}

export interface WeekStats {
  weekId: string;
  weekStart: string;
  weekNumber: number;
  year: number;
  plannedSessions: number;
  completedSessions: number;
  plannedSets: number;
  doneSets: number;
  volume: number;
  groups: Record<MuscleGroup, { planned: number; done: number }>;
}

const emptyGroups = () =>
  Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, { planned: 0, done: 0 }])) as WeekStats["groups"];

export const computeWeekStats = (week: WeekLike): WeekStats => {
  const stats: WeekStats = {
    weekId: week.id,
    weekStart: week.week_start_date,
    weekNumber: week.week_number,
    year: week.year,
    plannedSessions: 0,
    completedSessions: 0,
    plannedSets: 0,
    doneSets: 0,
    volume: 0,
    groups: emptyGroups(),
  };

  for (const day of week.workout_days ?? []) {
    if (day.is_rest_day) continue;
    const { plan } = parseDayPlan(day.exercises);
    if (!plan.exercises.length) continue;
    stats.plannedSessions++;

    let dayDone = 0;
    for (const p of plan.exercises) {
      const group = getExercise(p.exerciseId)?.group;
      const done = fillLog(p).filter((s) => s.done);
      stats.plannedSets += p.sets;
      stats.doneSets += done.length;
      dayDone += done.length;
      stats.volume += done.reduce((sum, s) => sum + s.weight * s.reps, 0);
      if (group) {
        stats.groups[group].planned += p.sets;
        stats.groups[group].done += done.length;
      }
    }
    if (dayDone > 0) stats.completedSessions++;
  }
  return stats;
};

/** Stats for every week, newest first. */
export const computeAllWeekStats = (weeks: WeekLike[]) =>
  weeks.map(computeWeekStats).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
