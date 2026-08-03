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

export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export const activityLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sitzend (kaum Bewegung)',
  light: 'Leicht aktiv (1-3x Sport/Woche)',
  moderate: 'Mäßig aktiv (3-5x Sport/Woche)',
  active: 'Sehr aktiv (6-7x Sport/Woche)',
  very_active: 'Extrem aktiv (körperliche Arbeit + Sport)',
}

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

interface TdeeParams {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
}

export function calculateTdee({ gender, age, heightCm, weightKg, activity }: TdeeParams): number {
  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  return Math.round(bmr * activityMultipliers[activity])
}

export function macroCaloriePercentages(
  goals: { protein: number; fat: number; carbs: number },
  calorieGoal: number,
): { protein: number; fat: number; carbs: number } {
  if (!calorieGoal) return { protein: 0, fat: 0, carbs: 0 }
  return {
    protein: Math.round(((goals.protein * 4) / calorieGoal) * 100),
    fat: Math.round(((goals.fat * 9) / calorieGoal) * 100),
    carbs: Math.round(((goals.carbs * 4) / calorieGoal) * 100),
  }
}
