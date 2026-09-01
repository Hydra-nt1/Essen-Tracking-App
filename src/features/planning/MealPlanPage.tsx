import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { addDays, formatDateLabel, startOfWeek, todayKey } from '../../lib/date'
import { useAddMealPlanItem, useDeleteMealPlanItem, useMealPlanItems } from './useMealPlan'
import { AddPlanItemDialog } from './AddPlanItemDialog'
import type { MealType } from '../../types/database'

const meals: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Frühstück' },
  { type: 'lunch', label: 'Mittagessen' },
  { type: 'dinner', label: 'Abendessen' },
  { type: 'snack', label: 'Snack' },
]

export function MealPlanPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()))
  const [activeSlot, setActiveSlot] = useState<{ date: string; meal: MealType } | null>(null)

  const { data: items } = useMealPlanItems(weekStart)
  const addItem = useAddMealPlanItem()
  const deleteItem = useDeleteMealPlanItem()

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayKey()

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>📅</span> Planung
      </h1>

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
          <Card key={day} className={`min-w-[160px] ${day === today ? 'ring-2 ring-green-500' : ''}`}>
            <p className="mb-2 text-sm font-semibold text-gray-900">
              {formatDateLabel(day)}
              {day === today && <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Heute</span>}
            </p>
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
            mealType={activeSlot.meal}
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
    </div>
  )
}
