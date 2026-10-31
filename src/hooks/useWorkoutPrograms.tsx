import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, getISOWeek, getISOWeekYear, startOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { clearPlanLogs } from "@/data/exercises";
import { useAuth } from "./useAuth";

/** One day of a saved program (no dates – applies to any week). */
export interface ProgramDay {
  day_of_week: number; // 0 = Sunday … 6 = Saturday
  body_part: string | null;
  exercises: string | null;
  notes: string | null;
  is_rest_day: boolean;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  days: ProgramDay[];
  created_at: string;
}

export interface DayContent {
  bodyPart: string | null;
  exercises: string | null;
  notes: string | null;
  isRestDay: boolean;
}

/** Offset from Monday for a JS day_of_week (Mon = 0 … Sun = 6). */
const mondayOffset = (dayOfWeek: number) => (dayOfWeek + 6) % 7;

export const useWorkoutPrograms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["workout-programs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_programs")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data.map((p) => ({ ...p, days: (p.days as unknown as ProgramDay[]) ?? [] })) as WorkoutProgram[];
    },
    enabled: !!user?.id,
  });

  /** Find the week containing `date`, creating it if needed. Returns its id and Monday. */
  const ensureWeek = async (date: Date) => {
    if (!user?.id) throw new Error("User not authenticated");
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, "yyyy-MM-dd");

    const { data: existing, error: findError } = await supabase
      .from("workout_weeks")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStartStr)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) return { weekId: existing.id, weekStart };

    const { data, error } = await supabase
      .from("workout_weeks")
      .insert({
        user_id: user.id,
        week_start_date: weekStartStr,
        week_number: getISOWeek(weekStart),
        year: getISOWeekYear(weekStart),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { weekId: data.id, weekStart };
  };

  const invalidateWeeks = () => queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
  const showError = (description: string) => () =>
    toast({ title: "Fel", description, variant: "destructive" });

  const saveProgram = useMutation({
    mutationFn: async ({ name, days }: { name: string; days: ProgramDay[] }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const cleaned = days.map((d) => ({ ...d, exercises: clearPlanLogs(d.exercises) }));
      const { error } = await supabase
        .from("workout_programs")
        .insert({ user_id: user.id, name, days: cleaned as unknown as Json });
      if (error) throw error;
    },
    onSuccess: (_d, { name }) => {
      queryClient.invalidateQueries({ queryKey: ["workout-programs"] });
      toast({ title: "Program sparat", description: `"${name}" kan nu användas på valfri vecka` });
    },
    onError: showError("Kunde inte spara programmet"),
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workout-programs"] }),
    onError: showError("Kunde inte ta bort programmet"),
  });

  /** Replace every day of the week containing `date` with the program's days. */
  const applyProgram = useMutation({
    mutationFn: async ({ program, date }: { program: WorkoutProgram; date: Date }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { weekId, weekStart } = await ensureWeek(date);

      const { error: delError } = await supabase.from("workout_days").delete().eq("workout_week_id", weekId);
      if (delError) throw delError;

      const rows = program.days.map((d) => ({
        user_id: user.id,
        workout_week_id: weekId,
        day_of_week: d.day_of_week,
        date: format(addDays(weekStart, mondayOffset(d.day_of_week)), "yyyy-MM-dd"),
        body_part: d.body_part,
        exercises: d.exercises,
        notes: d.notes,
        is_rest_day: d.is_rest_day,
      }));
      if (rows.length) {
        const { error } = await supabase.from("workout_days").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_d, { program }) => {
      invalidateWeeks();
      toast({ title: "Program tillämpat", description: `"${program.name}" lades in för veckan` });
    },
    onError: showError("Kunde inte tillämpa programmet"),
  });

  /** Copy one day's plan to any date (the target week is created if missing). */
  const copyDay = useMutation({
    mutationFn: async ({ content, targetDate }: { content: DayContent; targetDate: Date }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { weekId } = await ensureWeek(targetDate);
      const dayOfWeek = targetDate.getDay();

      const row = {
        user_id: user.id,
        workout_week_id: weekId,
        day_of_week: dayOfWeek,
        date: format(targetDate, "yyyy-MM-dd"),
        body_part: content.bodyPart || null,
        exercises: content.isRestDay ? null : clearPlanLogs(content.exercises),
        notes: content.notes || null,
        is_rest_day: content.isRestDay,
      };

      const { data: existing } = await supabase
        .from("workout_days")
        .select("id")
        .eq("workout_week_id", weekId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      const { error } = existing
        ? await supabase.from("workout_days").update(row).eq("id", existing.id)
        : await supabase.from("workout_days").insert(row);
      if (error) throw error;
    },
    onSuccess: (_d, { targetDate }) => {
      invalidateWeeks();
      toast({ title: "Kopierad", description: `Passet kopierades till ${format(targetDate, "d/M")}` });
    },
    onError: showError("Kunde inte kopiera passet"),
  });

  return {
    programs,
    isLoadingPrograms,
    saveProgram: saveProgram.mutate,
    isSavingProgram: saveProgram.isPending,
    deleteProgram: deleteProgram.mutate,
    applyProgram: applyProgram.mutate,
    isApplyingProgram: applyProgram.isPending,
    copyDay: copyDay.mutate,
    isCopyingDay: copyDay.isPending,
  };
};
