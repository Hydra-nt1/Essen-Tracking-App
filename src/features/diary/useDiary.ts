import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { DiaryEntryWithFood, MealType } from '../../types/database'
import { useAuth } from '../auth/AuthContext'

export function useDiaryEntries(date: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['diary_entries', user?.id, date],
    enabled: !!user,
    queryFn: async (): Promise<DiaryEntryWithFood[]> => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*, food:foods(*)')
        .eq('user_id', user!.id)
        .eq('date', date)
        .order('logged_at')
      if (error) throw error
      return data as unknown as DiaryEntryWithFood[]
    },
  })
}

interface NewDiaryEntry {
  food_id: string
  date: string
  meal_type: MealType
  quantity_g: number
}

export function useAddDiaryEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: NewDiaryEntry) => {
      const { error } = await supabase.from('diary_entries').insert({ ...entry, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diary_entries', user?.id, variables.date] })
    },
  })
}

export function useDeleteDiaryEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; date: string }) => {
      const { error } = await supabase.from('diary_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diary_entries', user?.id, variables.date] })
    },
  })
}
