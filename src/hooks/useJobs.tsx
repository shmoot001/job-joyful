import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Job {
  id: string;
  name: string;
  description?: string;
  hourly_rate: number;
  color: string;
  break_time: number; // Break time in minutes
  ob_rate: number; // OB rate in SEK per hour
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useJobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user?.id,
  });

  const createJobMutation = useMutation({
    mutationFn: async (job: Omit<Job, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("jobs")
        .insert([{ ...job, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", user?.id] });
      toast({
        title: "Jobb skapat",
        description: "Ditt nya jobb har lagts till",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Job> & { id: string }) => {
      // First, get the current job data to check if break_time changed
      const { data: currentJob } = await supabase
        .from("jobs")
        .select("break_time")
        .eq("id", id)
        .single();

      // Update the job
      const { data: updatedJob, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // If break_time was updated, recalculate all shifts for this job
      if (updates.break_time !== undefined && currentJob && updates.break_time !== currentJob.break_time) {
        const { data: shifts } = await supabase
          .from("shifts")
          .select("id, start_time, end_time, hours")
          .eq("job_id", id);

        if (shifts && shifts.length > 0) {
          const updatedShifts = shifts.map(shift => {
            // Calculate total time between start and end
            const [startHour, startMinute] = shift.start_time.split(':').map(Number);
            const [endHour, endMinute] = shift.end_time.split(':').map(Number);
            
            const startDate = new Date();
            startDate.setHours(startHour, startMinute, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(endHour, endMinute, 0, 0);
            
            // Handle overnight shifts
            if (endDate < startDate) {
              endDate.setDate(endDate.getDate() + 1);
            }
            
            const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            const breakHours = (updates.break_time || 0) / 60;
            const newWorkingHours = Math.max(0, totalHours - breakHours);

            return {
              id: shift.id,
              hours: newWorkingHours
            };
          });

          // Update all shifts with new working hours
          for (const shift of updatedShifts) {
            await supabase
              .from("shifts")
              .update({ hours: shift.hours })
              .eq("id", shift.id);
          }
        }
      }

      return updatedJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["shifts", user?.id] });
      toast({
        title: "Jobb uppdaterat",
        description: "Ändringarna har sparats och skift har uppdaterats",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", user?.id] });
      toast({
        title: "Jobb borttaget",
        description: "Jobbet har tagits bort",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    jobs,
    isLoading,
    error,
    createJob: createJobMutation.mutate,
    updateJob: updateJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending,
    isDeleting: deleteJobMutation.isPending,
  };
};