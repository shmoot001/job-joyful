import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    jobs: any[];
    shifts: any[];
    tasks: any[];
    notes: any[];
    categories: any[];
    cars: any[];
    business_transactions: any[];
    workout_weeks: any[];
    workout_days: any[];
    profile: any;
  };
}

export function useDataBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const exportData = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att exportera data",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all user data in parallel
      const [
        jobsRes,
        shiftsRes,
        tasksRes,
        notesRes,
        categoriesRes,
        carsRes,
        transactionsRes,
        workoutWeeksRes,
        workoutDaysRes,
        profileRes,
      ] = await Promise.all([
        supabase.from("jobs").select("*").eq("user_id", user.id),
        supabase.from("shifts").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("categories").select("*").eq("user_id", user.id),
        supabase.from("cars").select("*").eq("user_id", user.id),
        supabase.from("business_transactions").select("*").eq("user_id", user.id),
        supabase.from("workout_weeks").select("*").eq("user_id", user.id),
        supabase.from("workout_days").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const backup: BackupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        data: {
          jobs: jobsRes.data || [],
          shifts: shiftsRes.data || [],
          tasks: tasksRes.data || [],
          notes: notesRes.data || [],
          categories: categoriesRes.data || [],
          cars: carsRes.data || [],
          business_transactions: transactionsRes.data || [],
          workout_weeks: workoutWeeksRes.data || [],
          workout_days: workoutDaysRes.data || [],
          profile: profileRes.data,
        },
      };

      // Create and download the file
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export klar",
        description: "Din data har exporterats framgångsrikt",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Exportfel",
        description: "Kunde inte exportera data. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File): Promise<void> => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att importera data",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error("Ogiltig backupfil");
      }

      // Map old IDs to new IDs for relationships
      const jobIdMap = new Map<string, string>();
      const categoryIdMap = new Map<string, string>();
      const workoutWeekIdMap = new Map<string, string>();

      // Import categories first (tasks reference them by name, not ID)
      if (backup.data.categories?.length > 0) {
        for (const category of backup.data.categories) {
          const oldId = category.id;
          const { data, error } = await supabase
            .from("categories")
            .insert({
              name: category.name,
              color: category.color,
              user_id: user.id,
            })
            .select()
            .single();
          if (data) categoryIdMap.set(oldId, data.id);
        }
      }

      // Import jobs
      if (backup.data.jobs?.length > 0) {
        for (const job of backup.data.jobs) {
          const oldId = job.id;
          const { data, error } = await supabase
            .from("jobs")
            .insert({
              name: job.name,
              description: job.description,
              hourly_rate: job.hourly_rate,
              ob_rate: job.ob_rate,
              break_time: job.break_time,
              color: job.color,
              user_id: user.id,
            })
            .select()
            .single();
          if (data) jobIdMap.set(oldId, data.id);
        }
      }

      // Import shifts (with new job IDs)
      if (backup.data.shifts?.length > 0) {
        const shiftsToInsert = backup.data.shifts
          .filter((shift: any) => jobIdMap.has(shift.job_id))
          .map((shift: any) => ({
            job_id: jobIdMap.get(shift.job_id),
            date: shift.date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            hours: shift.hours,
            notes: shift.notes,
            user_id: user.id,
          }));
        if (shiftsToInsert.length > 0) {
          await supabase.from("shifts").insert(shiftsToInsert);
        }
      }

      // Import tasks
      if (backup.data.tasks?.length > 0) {
        const tasksToInsert = backup.data.tasks.map((task: any) => ({
          title: task.title,
          description: task.description,
          category: task.category,
          deadline: task.deadline,
          completed: task.completed,
          completed_at: task.completed_at,
          user_id: user.id,
        }));
        await supabase.from("tasks").insert(tasksToInsert);
      }

      // Import notes
      if (backup.data.notes?.length > 0) {
        const notesToInsert = backup.data.notes.map((note: any) => ({
          title: note.title,
          content: note.content,
          color: note.color,
          user_id: user.id,
        }));
        await supabase.from("notes").insert(notesToInsert);
      }

      // Import cars
      if (backup.data.cars?.length > 0) {
        const carsToInsert = backup.data.cars.map((car: any) => ({
          model: car.model,
          car_number: car.car_number,
          tax_price: car.tax_price,
          tax_month: car.tax_month,
          insurance_price: car.insurance_price,
          insurance_date: car.insurance_date,
          inspection_date: car.inspection_date,
          user_id: user.id,
        }));
        await supabase.from("cars").insert(carsToInsert);
      }

      // Import business transactions
      if (backup.data.business_transactions?.length > 0) {
        const transactionsToInsert = backup.data.business_transactions.map(
          (tx: any) => ({
            type: tx.type,
            category: tx.category,
            product: tx.product,
            price: tx.price,
            date: tx.date,
            status: tx.status,
            link_order_number: tx.link_order_number,
            user_id: user.id,
          })
        );
        await supabase.from("business_transactions").insert(transactionsToInsert);
      }

      // Import workout weeks
      if (backup.data.workout_weeks?.length > 0) {
        for (const week of backup.data.workout_weeks) {
          const oldId = week.id;
          const { data, error } = await supabase
            .from("workout_weeks")
            .insert({
              week_number: week.week_number,
              year: week.year,
              week_start_date: week.week_start_date,
              notes: week.notes,
              user_id: user.id,
            })
            .select()
            .single();
          if (data) workoutWeekIdMap.set(oldId, data.id);
        }
      }

      // Import workout days (with new week IDs)
      if (backup.data.workout_days?.length > 0) {
        const daysToInsert = backup.data.workout_days
          .filter((day: any) => workoutWeekIdMap.has(day.workout_week_id))
          .map((day: any) => ({
            workout_week_id: workoutWeekIdMap.get(day.workout_week_id),
            day_of_week: day.day_of_week,
            date: day.date,
            body_part: day.body_part,
            exercises: day.exercises,
            notes: day.notes,
            is_rest_day: day.is_rest_day,
            user_id: user.id,
          }));
        if (daysToInsert.length > 0) {
          await supabase.from("workout_days").insert(daysToInsert);
        }
      }

      toast({
        title: "Import klar",
        description: "Din data har importerats framgångsrikt",
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Importfel",
        description:
          error instanceof Error ? error.message : "Kunde inte importera data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStats = async () => {
    if (!user) return null;

    const [jobs, shifts, tasks, notes, categories, cars, transactions] =
      await Promise.all([
        supabase.from("jobs").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("shifts").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("categories").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("cars").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("business_transactions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
      ]);

    return {
      jobs: jobs.count || 0,
      shifts: shifts.count || 0,
      tasks: tasks.count || 0,
      notes: notes.count || 0,
      categories: categories.count || 0,
      cars: cars.count || 0,
      transactions: transactions.count || 0,
    };
  };

  return {
    exportData,
    importData,
    getStats,
    isExporting,
    isImporting,
  };
}
