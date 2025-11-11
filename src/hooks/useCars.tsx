import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Car {
  id: string;
  user_id: string;
  car_number: string;
  model: string;
  inspection_date: string | null;
  tax_month: string | null;
  tax_price: number;
  insurance_price: number;
  insurance_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useCars = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Car[];
    },
    enabled: !!user,
  });

  const addCar = useMutation({
    mutationFn: async (car: Omit<Car, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cars')
        .insert([{ ...car, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Bil tillagd');
    },
    onError: (error) => {
      toast.error('Kunde inte lägga till bil: ' + error.message);
    },
  });

  const updateCar = useMutation({
    mutationFn: async ({ id, ...car }: Partial<Car> & { id: string }) => {
      const { data, error } = await supabase
        .from('cars')
        .update(car)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Bil uppdaterad');
    },
    onError: (error) => {
      toast.error('Kunde inte uppdatera bil: ' + error.message);
    },
  });

  const deleteCar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Bil borttagen');
    },
    onError: (error) => {
      toast.error('Kunde inte ta bort bil: ' + error.message);
    },
  });

  return {
    cars,
    isLoading,
    addCar: addCar.mutate,
    updateCar: updateCar.mutate,
    deleteCar: deleteCar.mutate,
    isAdding: addCar.isPending,
    isUpdating: updateCar.isPending,
    isDeleting: deleteCar.isPending,
  };
};
