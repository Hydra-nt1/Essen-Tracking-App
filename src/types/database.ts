export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodSource = 'custom' | 'openfoodfacts'
export type ShoppingItemSource = 'manual' | 'generated'

export interface Profile {
  id: string
  display_name: string | null
  daily_calorie_goal: number | null
  protein_goal_g: number | null
  fat_goal_g: number | null
  carbs_goal_g: number | null
  created_at: string
}

export interface Food {
  id: string
  user_id: string
  name: string
  brand: string | null
  barcode: string | null
  calories_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  source: FoodSource
  created_at: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  food_id: string
  date: string
  meal_type: MealType
  quantity_g: number
  logged_at: string
}

export interface DiaryEntryWithFood extends DiaryEntry {
  food: Food
}

export interface WeightEntry {
  id: string
  user_id: string
  date: string
  weight_kg: number
  note: string | null
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  servings: number
  created_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  food_id: string
  quantity_g: number
}

export interface RecipeIngredientWithFood extends RecipeIngredient {
  food: Food
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredientWithFood[]
}

export interface MealPlanItem {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  food_id: string | null
  recipe_id: string | null
  quantity_g: number | null
  created_at: string
}

export interface MealPlanItemWithDetails extends MealPlanItem {
  food: Food | null
  recipe: RecipeWithIngredients | null
}

export interface ShoppingListItem {
  id: string
  user_id: string
  name: string
  quantity: number | null
  unit: string | null
  is_checked: boolean
  source: ShoppingItemSource
  created_at: string
}
