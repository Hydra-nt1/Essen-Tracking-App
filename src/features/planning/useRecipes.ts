import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { RecipeWithIngredients } from '../../types/database'
import { useAuth } from '../auth/AuthContext'

export function useRecipes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recipes', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RecipeWithIngredients[]> => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*, food:foods(*))')
        .eq('user_id', user!.id)
        .order('name')
      if (error) throw error
      return data as unknown as RecipeWithIngredients[]
    },
  })
}

interface NewRecipeIngredient {
  food_id: string
  quantity_g: number
}

interface NewRecipe {
  name: string
  servings: number
  ingredients: NewRecipeIngredient[]
}

export function useCreateRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: NewRecipe) => {
      const { data: created, error } = await supabase
        .from('recipes')
        .insert({ name: recipe.name, servings: recipe.servings, user_id: user!.id })
        .select()
        .single()
      if (error) throw error

      const rows = recipe.ingredients.map((i) => ({ ...i, recipe_id: created.id }))
      const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(rows)
      if (ingredientsError) throw ingredientsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] })
    },
  })
}

export function useDeleteRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] })
    },
  })
}
