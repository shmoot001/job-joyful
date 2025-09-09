import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Shift {
  id: string;
  job_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours?: number;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  jobs?: {
    name: string;
    color: string;
    hourly_rate: number;
    ob_rate: number;
  };
}

export const useShifts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: shifts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shifts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          *,
          jobs (
            name,
            color,
            hourly_rate,
            ob_rate
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Shift[];
    },
    enabled: !!user?.id,
  });

  const createShiftMutation = useMutation({
    mutationFn: async (shift: Omit<Shift, "id" | "user_id" | "created_at" | "updated_at" | "jobs">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("shifts")
        .insert([{ ...shift, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", user?.id] });
      toast({
        title: "Skift skapat",
        description: "Ditt nya skift har lagts till",
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

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shift> & { id: string }) => {
      const { data, error } = await supabase
        .from("shifts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", user?.id] });
      toast({
        title: "Skift uppdaterat",
        description: "Ändringarna har sparats",
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

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", user?.id] });
      toast({
        title: "Skift borttaget",
        description: "Skiftet har tagits bort",
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
    shifts,
    isLoading,
    error,
    createShift: createShiftMutation.mutate,
    updateShift: updateShiftMutation.mutate,
    deleteShift: deleteShiftMutation.mutate,
    isCreating: createShiftMutation.isPending,
    isUpdating: updateShiftMutation.isPending,
    isDeleting: deleteShiftMutation.isPending,
  };
};