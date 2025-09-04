import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type BusinessTransaction = Database['public']['Tables']['business_transactions']['Row'];
type BusinessTransactionInsert = Database['public']['Tables']['business_transactions']['Insert'];
type BusinessTransactionUpdate = Database['public']['Tables']['business_transactions']['Update'];

export function useBusiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['business-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('business_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as BusinessTransaction[];
    },
    enabled: !!user?.id,
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<BusinessTransactionInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('business_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-transactions'] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: BusinessTransactionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('business_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-transactions'] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-transactions'] });
    },
  });

  const transactions = transactionsQuery.data || [];
  const inTransactions = transactions.filter(t => t.type === 'IN');
  const outTransactions = transactions.filter(t => t.type === 'OUT');

  const totalIn = inTransactions.reduce((sum, t) => sum + Number(t.price), 0);
  const totalOut = outTransactions.reduce((sum, t) => sum + Number(t.price), 0);

  return {
    transactions,
    inTransactions,
    outTransactions,
    totalIn,
    totalOut,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isAdding: addTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
  };
}