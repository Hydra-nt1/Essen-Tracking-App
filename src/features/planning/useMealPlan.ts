import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { MealPlanItemWithDetails, MealType } from '../../types/database'
import { useAuth } from '../auth/AuthContext'
import { addDays } from '../../lib/date'

export function useMealPlanItems(weekStart: string) {
  const { user } = useAuth()
  const weekEnd = addDays(weekStart, 6)

  return useQuery({
    queryKey: ['meal_plan_items', user?.id, weekStart],
    enabled: !!user,
    queryFn: async (): Promise<MealPlanItemWithDetails[]> => {
      const { data, error } = await supabase
        .from('meal_plan_items')
        .select('*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))')
        .eq('user_id', user!.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
      if (error) throw error
      return data as unknown as MealPlanItemWithDetails[]
    },
  })
}

interface NewMealPlanItem {
  date: string
  meal_type: MealType
  food_id?: string
  recipe_id?: string
  quantity_g: number
}

export function useAddMealPlanItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: NewMealPlanItem) => {
      const { error } = await supabase.from('meal_plan_items').insert({ ...item, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plan_items', user?.id] })
    },
  })
}

export function useDeleteMealPlanItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meal_plan_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plan_items', user?.id] })
    },
  })
}
