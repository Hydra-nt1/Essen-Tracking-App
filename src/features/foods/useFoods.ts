import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Food } from '../../types/database'
import { useAuth } from '../auth/AuthContext'

export function useFoods(search = '') {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foods', user?.id, search],
    enabled: !!user,
    queryFn: async (): Promise<Food[]> => {
      let query = supabase.from('foods').select('*').eq('user_id', user!.id).order('name')
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export async function findFoodByBarcode(userId: string, barcode: string): Promise<Food | null> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('user_id', userId)
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) throw error
  return data
}

export type NewFood = Omit<Food, 'id' | 'user_id' | 'created_at'>

export function useCreateFood() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (food: NewFood): Promise<Food> => {
      const { data, error } = await supabase
        .from('foods')
        .insert({ ...food, user_id: user!.id })
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

export function useUpdateFood() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewFood> }) => {
      const { error } = await supabase.from('foods').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', user?.id] })
    },
  })
}

export function useDeleteFood() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('foods').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods', user?.id] })
    },
  })
}
