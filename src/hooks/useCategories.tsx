import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user?.id,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", user?.id] });
      toast({
        title: "Kategori skapad",
        description: "Din nya kategori har lagts till",
      });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: "Kategori finns redan",
          description: "En kategori med detta namn finns redan",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fel",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", user?.id] });
      toast({
        title: "Kategori uppdaterad",
        description: "Ändringarna har sparats",
      });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: "Kategori finns redan",
          description: "En kategori med detta namn finns redan",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fel",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", user?.id] });
      toast({
        title: "Kategori borttagen",
        description: "Kategorin har tagits bort",
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
    categories,
    isLoading,
    error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
};