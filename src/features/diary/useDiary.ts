import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { DiaryEntryWithFood, Food, MealType } from '../../types/database'
import { useAuth } from '../auth/AuthContext'

export interface FrequentFood {
  food: Food
  count: number
  lastQuantityG: number
}

export function useFrequentFoodsForMeal(mealType: MealType | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['frequent_foods', user?.id, mealType],
    enabled: !!user && !!mealType,
    queryFn: async (): Promise<FrequentFood[]> => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('food_id, quantity_g, logged_at, food:foods(*)')
        .eq('user_id', user!.id)
        .eq('meal_type', mealType!)
        .order('logged_at', { ascending: false })
        .limit(200)
      if (error) throw error

      const byFood = new Map<string, FrequentFood>()
      for (const entry of data as unknown as { food_id: string; quantity_g: number; food: Food | null }[]) {
        if (!entry.food) continue
        const existing = byFood.get(entry.food_id)
        if (existing) {
          existing.count += 1
        } else {
          byFood.set(entry.food_id, { food: entry.food, count: 1, lastQuantityG: entry.quantity_g })
        }
      }

      return Array.from(byFood.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    },
  })
}

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
