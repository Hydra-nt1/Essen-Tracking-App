import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FoodPicker } from '../../components/FoodPicker'
import { MacroBar } from '../../components/MacroBar'
import { DayStrip } from '../../components/DayStrip'
import { todayKey } from '../../lib/date'
import { macrosForQuantity, round1, sumMacros } from '../../lib/nutrition'
import { useAddDiaryEntry, useDeleteDiaryEntry, useDiaryEntries } from '../diary/useDiary'
import { useProfile } from '../profile/useProfile'
import type { MealType } from '../../types/database'

const meals: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Frühstück', icon: '🍳' },
  { type: 'lunch', label: 'Mittagessen', icon: '🍽️' },
  { type: 'dinner', label: 'Abendessen', icon: '🌙' },
  { type: 'snack', label: 'Snacks', icon: '🍿' },
]

export function DashboardPage() {
  const [date, setDate] = useState(todayKey())
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null)

  const { data: entries, isLoading: entriesLoading } = useDiaryEntries(date)
  const { data: profile, isLoading: profileLoading } = useProfile()
  const addEntry = useAddDiaryEntry()
  const deleteEntry = useDeleteDiaryEntry()

  const totals = sumMacros((entries ?? []).map((e) => macrosForQuantity(e.food, e.quantity_g)))

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>🏠</span> Übersicht
      </h1>

      <DayStrip selected={date} onSelect={setDate} />

      <Card className="mb-6 space-y-4">
        <MacroBar label="Kalorien" value={totals.calories} goal={profile?.daily_calorie_goal ?? null} unit="kcal" colorClass="bg-green-500" />
        <MacroBar label="Protein" value={totals.protein} goal={profile?.protein_goal_g ?? null} unit="g" colorClass="bg-blue-500" />
        <MacroBar label="Fett" value={totals.fat} goal={profile?.fat_goal_g ?? null} unit="g" colorClass="bg-amber-500" />
        <MacroBar label="Kohlenhydrate" value={totals.carbs} goal={profile?.carbs_goal_g ?? null} unit="g" colorClass="bg-purple-500" />

        {!profileLoading && !profile?.daily_calorie_goal && (
          <p className="text-xs text-gray-500">
            Noch keine Ziele gesetzt.{' '}
            <Link to="/profile" className="text-green-600 hover:underline">
              Jetzt im Profil festlegen
            </Link>
            .
          </p>
        )}
      </Card>

      {entriesLoading && <p className="text-gray-500">Lädt...</p>}

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
                <h2 className="flex items-center gap-2 font-medium text-gray-900">
                  <span>{meal.icon}</span>
                  {meal.label}
                  <span className="font-normal text-gray-500">· {Math.round(mealCalories)} kcal</span>
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
        {activeMeal && (
          <FoodPicker
            mealType={activeMeal}
            onSelect={async (food, quantityG) => {
              await addEntry.mutateAsync({ food_id: food.id, date, meal_type: activeMeal, quantity_g: round1(quantityG) })
              setActiveMeal(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
