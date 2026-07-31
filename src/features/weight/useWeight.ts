import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { WeightEntry } from '../../types/database'
import { useAuth } from '../auth/AuthContext'

export function useWeightEntries() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['weight_entries', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeightEntry[]> => {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('date')
      if (error) throw error
      return data
    },
  })
}

export function useUpsertWeightEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: { date: string; weight_kg: number; note?: string | null }) => {
      const { error } = await supabase
        .from('weight_entries')
        .upsert({ ...entry, user_id: user!.id }, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_entries', user?.id] })
    },
  })
}

export function useDeleteWeightEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weight_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_entries', user?.id] })
    },
  })
}
