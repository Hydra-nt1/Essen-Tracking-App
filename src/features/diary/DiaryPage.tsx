import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FoodPicker } from '../../components/FoodPicker'
import { addDays, formatDateLabel, todayKey } from '../../lib/date'
import { macrosForQuantity, round1 } from '../../lib/nutrition'
import { useAddDiaryEntry, useDeleteDiaryEntry, useDiaryEntries } from './useDiary'
import type { MealType } from '../../types/database'

const meals: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Frühstück' },
  { type: 'lunch', label: 'Mittagessen' },
  { type: 'dinner', label: 'Abendessen' },
  { type: 'snack', label: 'Snacks' },
]

export function DiaryPage() {
  const [date, setDate] = useState(todayKey())
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null)
  const { data: entries, isLoading } = useDiaryEntries(date)
  const addEntry = useAddDiaryEntry()
  const deleteEntry = useDeleteDiaryEntry()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setDate(addDays(date, -1))}>
          ← Vorheriger Tag
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">{formatDateLabel(date)}</h1>
        <Button variant="ghost" onClick={() => setDate(addDays(date, 1))}>
          Nächster Tag →
        </Button>
      </div>

      {isLoading && <p className="text-gray-500">Lädt...</p>}

      <div className="space-y-4">
        {meals.map((meal) => {
          const mealEntries = entries?.filter((e) => e.meal_type === meal.type) ?? []
          const mealCalories = mealEntries.reduce(
            (sum, e) => sum + macrosForQuantity(e.food, e.quantity_g).calories,
            0,
          )

          return (
            <Card key={meal.type}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-medium text-gray-900">
                  {meal.label} <span className="font-normal text-gray-500">· {Math.round(mealCalories)} kcal</span>
                </h2>
                <Button variant="ghost" onClick={() => setActiveMeal(meal.type)}>
                  + Hinzufügen
                </Button>
              </div>
              {mealEntries.length === 0 ? (
                <p className="text-sm text-gray-400">Noch nichts geloggt.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {mealEntries.map((entry) => {
                    const macros = macrosForQuantity(entry.food, entry.quantity_g)
                    return (
                      <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-800">{entry.food.name}</span>{' '}
                          <span className="text-gray-500">
                            · {entry.quantity_g}g · {Math.round(macros.calories)} kcal
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEntry.mutate({ id: entry.id, date })}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Entfernen
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      <Modal
        open={activeMeal !== null}
        onClose={() => setActiveMeal(null)}
        title={`${meals.find((m) => m.type === activeMeal)?.label ?? ''} – Lebensmittel hinzufügen`}
      >
        <FoodPicker
          onSelect={async (food, quantityG) => {
            if (!activeMeal) return
            await addEntry.mutateAsync({ food_id: food.id, date, meal_type: activeMeal, quantity_g: round1(quantityG) })
            setActiveMeal(null)
          }}
        />
      </Modal>
    </div>
  )
}
