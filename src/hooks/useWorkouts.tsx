import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { clearPlanLogs } from "@/data/exercises";
import { format, addDays, getISOWeek, getISOWeekYear, parseISO } from "date-fns";

export const useWorkouts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch workout weeks
  const {
    data: workoutWeeks,
    isLoading: isLoadingWeeks,
    error: weeksError,
  } = useQuery({
    queryKey: ["workout-weeks", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("workout_weeks")
        .select(`
          *,
          workout_days (*)
        `)
        .eq("user_id", user.id)
        .order("week_start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create workout week
  const createWorkoutWeek = useMutation({
    mutationFn: async (weekStartDate: Date) => {
      if (!user?.id) throw new Error("User not authenticated");

      const weekNumber = getISOWeek(weekStartDate);
      const year = getISOWeekYear(weekStartDate);

      const { data, error } = await supabase
        .from("workout_weeks")
        .insert({
          user_id: user.id,
          week_start_date: format(weekStartDate, "yyyy-MM-dd"),
          week_number: weekNumber,
          year: year,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
      toast({
        title: "Framgång",
        description: "Träningsvecka skapad",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa träningsvecka",
        variant: "destructive",
      });
    },
  });

  // Update workout day
  const updateWorkoutDay = useMutation({
    mutationFn: async ({
      workoutWeekId,
      dayOfWeek,
      date,
      bodyPart,
      exercises,
      notes,
      isRestDay,
    }: {
      workoutWeekId: string;
      dayOfWeek: number;
      date: Date;
      bodyPart?: string;
      exercises?: string | null;
      notes?: string;
      isRestDay?: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if workout day already exists
      const { data: existingDay } = await supabase
        .from("workout_days")
        .select("*")
        .eq("workout_week_id", workoutWeekId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      const workoutDayData = {
        user_id: user.id,
        workout_week_id: workoutWeekId,
        day_of_week: dayOfWeek,
        date: format(date, "yyyy-MM-dd"),
        body_part: bodyPart || null,
        exercises: exercises || null,
        notes: notes || null,
        is_rest_day: isRestDay || false,
      };

      if (existingDay) {
        // Update existing workout day
        const { data, error } = await supabase
          .from("workout_days")
          .update(workoutDayData)
          .eq("id", existingDay.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new workout day
        const { data, error } = await supabase
          .from("workout_days")
          .insert(workoutDayData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
      toast({
        title: "Sparad",
        description: "Träningsdag uppdaterad",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera träningsdag",
        variant: "destructive",
      });
    },
  });

  // Save workout progress (logged sets) silently, without toasts
  const saveDayProgress = useMutation({
    mutationFn: async ({ dayId, exercises }: { dayId: string; exercises: string | null }) => {
      const { error } = await supabase.from("workout_days").update({ exercises }).eq("id", dayId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
    },
    onError: () => {
      toast({ title: "Fel", description: "Kunde inte spara passet", variant: "destructive" });
    },
  });

  // Copy a week (all days, exercises, sets & reps) to the following week
  const duplicateWorkoutWeek = useMutation({
    mutationFn: async (weekId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: source, error: srcError } = await supabase
        .from("workout_weeks")
        .select("*, workout_days (*)")
        .eq("id", weekId)
        .single();
      if (srcError) throw srcError;

      const newStart = addDays(parseISO(source.week_start_date), 7);
      const newStartStr = format(newStart, "yyyy-MM-dd");

      const { data: existing } = await supabase
        .from("workout_weeks")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_date", newStartStr)
        .maybeSingle();
      if (existing) throw new Error("WEEK_EXISTS");

      const { data: newWeek, error: weekError } = await supabase
        .from("workout_weeks")
        .insert({
          user_id: user.id,
          week_start_date: newStartStr,
          week_number: getISOWeek(newStart),
          year: getISOWeekYear(newStart),
          notes: source.notes,
        })
        .select()
        .single();
      if (weekError) throw weekError;

      const days = (source.workout_days || []).map((d) => ({
        user_id: user.id,
        workout_week_id: newWeek.id,
        day_of_week: d.day_of_week,
        date: format(addDays(parseISO(d.date), 7), "yyyy-MM-dd"),
        body_part: d.body_part,
        exercises: clearPlanLogs(d.exercises),
        notes: d.notes,
        is_rest_day: d.is_rest_day,
      }));
      if (days.length) {
        const { error: daysError } = await supabase.from("workout_days").insert(days);
        if (daysError) throw daysError;
      }
      return newWeek;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
      toast({ title: "Kopierad", description: "Veckan kopierades till nästa vecka" });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description:
          error instanceof Error && error.message === "WEEK_EXISTS"
            ? "Nästa vecka finns redan"
            : "Kunde inte kopiera veckan",
        variant: "destructive",
      });
    },
  });

  // Delete workout week
  const deleteWorkoutWeek = useMutation({
    mutationFn: async (weekId: string) => {
      const { error } = await supabase
        .from("workout_weeks")
        .delete()
        .eq("id", weekId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-weeks"] });
      toast({
        title: "Borttagen",
        description: "Träningsvecka borttagen",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort träningsvecka",
        variant: "destructive",
      });
    },
  });

  return {
    workoutWeeks,
    isLoadingWeeks,
    weeksError,
    createWorkoutWeek: createWorkoutWeek.mutate,
    isCreatingWeek: createWorkoutWeek.isPending,
    updateWorkoutDay: updateWorkoutDay.mutate,
    isUpdatingDay: updateWorkoutDay.isPending,
    saveDayProgress: saveDayProgress.mutate,
    duplicateWorkoutWeek: duplicateWorkoutWeek.mutate,
    isDuplicatingWeek: duplicateWorkoutWeek.isPending,
    deleteWorkoutWeek: deleteWorkoutWeek.mutate,
    isDeletingWeek: deleteWorkoutWeek.isPending,
  };
};