export interface Macros {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface FoodPer100g {
  calories_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
}

export function macrosForQuantity(food: FoodPer100g, quantityG: number): Macros {
  const factor = quantityG / 100
  return {
    calories: food.calories_per_100g * factor,
    protein: food.protein_per_100g * factor,
    fat: food.fat_per_100g * factor,
    carbs: food.carbs_per_100g * factor,
  }
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      protein: total.protein + entry.protein,
      fat: total.fat + entry.fat,
      carbs: total.carbs + entry.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  )
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

interface RecipeForMacros {
  servings: number
  recipe_ingredients: { quantity_g: number; food: FoodPer100g }[]
}

export function macrosPerServing(recipe: RecipeForMacros): Macros {
  const total = sumMacros(recipe.recipe_ingredients.map((i) => macrosForQuantity(i.food, i.quantity_g)))
  const servings = recipe.servings || 1
  return {
    calories: total.calories / servings,
    protein: total.protein / servings,
    fat: total.fat / servings,
    carbs: total.carbs / servings,
  }
}
