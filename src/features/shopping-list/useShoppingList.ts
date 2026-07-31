import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { MealPlanItemWithDetails, ShoppingListItem } from '../../types/database'
import { useAuth } from '../auth/AuthContext'
import { addDays } from '../../lib/date'

export function useShoppingListItems() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shopping_list_items', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ShoppingListItem[]> => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useAddShoppingListItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: { name: string; quantity: number | null; unit: string | null }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({ ...item, user_id: user!.id, source: 'manual' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] })
    },
  })
}

export function useToggleShoppingListItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_checked }: { id: string; is_checked: boolean }) => {
      const { error } = await supabase.from('shopping_list_items').update({ is_checked }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] })
    },
  })
}

export function useDeleteShoppingListItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] })
    },
  })
}

export function useClearCheckedItems() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', user!.id)
        .eq('is_checked', true)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] })
    },
  })
}

export function useGenerateFromMealPlan() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (weekStart: string) => {
      const weekEnd = addDays(weekStart, 6)
      const { data, error } = await supabase
        .from('meal_plan_items')
        .select('*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))')
        .eq('user_id', user!.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
      if (error) throw error

      const planItems = data as unknown as MealPlanItemWithDetails[]
      const totals = new Map<string, number>()

      for (const item of planItems) {
        if (item.food) {
          totals.set(item.food.name, (totals.get(item.food.name) ?? 0) + (item.quantity_g ?? 0))
        } else if (item.recipe) {
          const servings = item.quantity_g ?? 1
          for (const ingredient of item.recipe.recipe_ingredients) {
            totals.set(
              ingredient.food.name,
              (totals.get(ingredient.food.name) ?? 0) + ingredient.quantity_g * servings,
            )
          }
        }
      }

      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', user!.id)
        .eq('source', 'generated')
      if (deleteError) throw deleteError

      if (totals.size === 0) return

      const rows = Array.from(totals.entries()).map(([name, grams]) => ({
        user_id: user!.id,
        name,
        quantity: Math.round(grams),
        unit: 'g',
        source: 'generated' as const,
      }))
      const { error: insertError } = await supabase.from('shopping_list_items').insert(rows)
      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] })
    },
  })
}
