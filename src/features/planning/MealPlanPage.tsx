import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { addDays, formatDateLabel, startOfWeek, todayKey } from '../../lib/date'
import { useAddMealPlanItem, useDeleteMealPlanItem, useMealPlanItems } from './useMealPlan'
import { useCreateRecipe, useDeleteRecipe, useRecipes } from './useRecipes'
import { RecipeForm } from './RecipeForm'
import { AddPlanItemDialog } from './AddPlanItemDialog'
import { macrosPerServing } from '../../lib/nutrition'
import type { MealType } from '../../types/database'

const meals: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Frühstück' },
  { type: 'lunch', label: 'Mittagessen' },
  { type: 'dinner', label: 'Abendessen' },
  { type: 'snack', label: 'Snack' },
]

export function MealPlanPage() {
  const [tab, setTab] = useState<'plan' | 'recipes'>('plan')
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()))
  const [activeSlot, setActiveSlot] = useState<{ date: string; meal: MealType } | null>(null)

  const { data: items } = useMealPlanItems(weekStart)
  const addItem = useAddMealPlanItem()
  const deleteItem = useDeleteMealPlanItem()

  const { data: recipes } = useRecipes()
  const createRecipe = useCreateRecipe()
  const deleteRecipe = useDeleteRecipe()
  const [showRecipeModal, setShowRecipeModal] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm w-fit">
        <button
          onClick={() => setTab('plan')}
          className={`rounded-md px-4 py-1.5 font-medium ${tab === 'plan' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Wochenplan
        </button>
        <button
          onClick={() => setTab('recipes')}
          className={`rounded-md px-4 py-1.5 font-medium ${tab === 'recipes' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Rezepte
        </button>
      </div>

      {tab === 'plan' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              ← Vorherige Woche
            </Button>
            <span className="text-sm text-gray-600">
              {formatDateLabel(weekStart)} – {formatDateLabel(addDays(weekStart, 6))}
            </span>
            <Button variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Nächste Woche →
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-7">
            {days.map((day) => (
              <Card key={day} className="min-w-[160px]">
                <p className="mb-2 text-sm font-semibold text-gray-900">{formatDateLabel(day)}</p>
                <div className="space-y-3">
                  {meals.map((meal) => {
                    const slotItems = items?.filter((i) => i.date === day && i.meal_type === meal.type) ?? []
                    return (
                      <div key={meal.type}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">{meal.label}</span>
                          <button
                            onClick={() => setActiveSlot({ date: day, meal: meal.type })}
                            className="text-xs font-medium text-green-700 hover:underline"
                          >
                            +
                          </button>
                        </div>
                        {slotItems.map((item) => (
                          <div key={item.id} className="mb-1 flex items-center justify-between text-xs text-gray-700">
                            <span>
                              {item.food ? item.food.name : item.recipe?.name}
                              {item.recipe ? ` ×${item.quantity_g}` : ` ${item.quantity_g}g`}
                            </span>
                            <button onClick={() => deleteItem.mutate(item.id)} className="text-red-500 hover:underline">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>

          <Modal
            open={activeSlot !== null}
            onClose={() => setActiveSlot(null)}
            title={activeSlot ? `${formatDateLabel(activeSlot.date)} – ${meals.find((m) => m.type === activeSlot.meal)?.label}` : ''}
          >
            {activeSlot && (
              <AddPlanItemDialog
                onSelectFood={async (food, quantityG) => {
                  await addItem.mutateAsync({
                    date: activeSlot.date,
                    meal_type: activeSlot.meal,
                    food_id: food.id,
                    quantity_g: quantityG,
                  })
                  setActiveSlot(null)
                }}
                onSelectRecipe={async (recipeId, servings) => {
                  await addItem.mutateAsync({
                    date: activeSlot.date,
                    meal_type: activeSlot.meal,
                    recipe_id: recipeId,
                    quantity_g: servings,
                  })
                  setActiveSlot(null)
                }}
              />
            )}
          </Modal>
        </>
      )}

      {tab === 'recipes' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Meine Rezepte</h2>
            <Button onClick={() => setShowRecipeModal(true)}>+ Rezept</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recipes?.map((recipe) => {
              const macros = macrosPerServing(recipe)
              return (
                <Card key={recipe.id}>
                  <div className="mb-1 flex items-start justify-between">
                    <p className="font-medium text-gray-900">{recipe.name}</p>
                    <button onClick={() => deleteRecipe.mutate(recipe.id)} className="text-xs text-red-500 hover:underline">
                      Löschen
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{recipe.servings} Portionen</p>
                  <p className="mt-2 text-sm text-gray-600">{Math.round(macros.calories)} kcal / Portion</p>
                  <ul className="mt-2 text-xs text-gray-500">
                    {recipe.recipe_ingredients.map((ing) => (
                      <li key={ing.id}>
                        {ing.food.name} – {ing.quantity_g}g
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
            {recipes?.length === 0 && <p className="text-gray-500">Noch keine Rezepte angelegt.</p>}
          </div>

          <Modal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} title="Rezept anlegen">
            <RecipeForm
              onSubmit={async (recipe) => {
                await createRecipe.mutateAsync(recipe)
                setShowRecipeModal(false)
              }}
            />
          </Modal>
        </div>
      )}
    </div>
  )
}
