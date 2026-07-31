import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Food } from '../../types/database'
import type { OpenFoodFactsResult } from '../../lib/openFoodFacts'
import { useAuth } from '../auth/AuthContext'

export function useImportOpenFoodFactsFood() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: OpenFoodFactsResult): Promise<Food> => {
      const { data: existing, error: lookupError } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', user!.id)
        .eq('barcode', product.barcode)
        .maybeSingle()
      if (lookupError) throw lookupError
      if (existing) return existing

      const { data, error } = await supabase
        .from('foods')
        .insert({
          user_id: user!.id,
          name: product.name,
          brand: product.brand,
          barcode: product.barcode,
          calories_per_100g: product.calories_per_100g,
          protein_per_100g: product.protein_per_100g,
          fat_per_100g: product.fat_per_100g,
          carbs_per_100g: product.carbs_per_100g,
          source: 'openfoodfacts',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', user?.id] })
    },
  })
}
