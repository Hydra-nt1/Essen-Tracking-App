import { useState } from 'react'
import { Button } from '../../components/Button'
import { FoodPicker } from '../../components/FoodPicker'
import { macrosPerServing } from '../../lib/nutrition'
import { useRecipes } from './useRecipes'
import type { Food } from '../../types/database'

type Tab = 'food' | 'recipe'

interface AddPlanItemDialogProps {
  onSelectFood: (food: Food, quantityG: number) => void
  onSelectRecipe: (recipeId: string, servings: number) => void
}

export function AddPlanItemDialog({ onSelectFood, onSelectRecipe }: AddPlanItemDialogProps) {
  const [tab, setTab] = useState<Tab>('food')
  const { data: recipes } = useRecipes()
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [servings, setServings] = useState('1')

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab('food')}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tab === 'food' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Lebensmittel
        </button>
        <button
          type="button"
          onClick={() => setTab('recipe')}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tab === 'recipe' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Rezept
        </button>
      </div>

      {tab === 'food' && <FoodPicker onSelect={onSelectFood} />}

      {tab === 'recipe' && (
        <div>
          {recipes?.length === 0 && <p className="text-sm text-gray-500">Noch keine Rezepte angelegt.</p>}
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {recipes?.map((recipe) => {
              const macros = macrosPerServing(recipe)
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    selectedRecipeId === recipe.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">{recipe.name}</span>{' '}
                  <span className="text-gray-500">· {Math.round(macros.calories)} kcal/Portion</span>
                </button>
              )
            })}
          </div>

          {selectedRecipeId && (
            <div className="mt-4 flex items-end gap-3 border-t border-gray-100 pt-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Portionen</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>
              <Button onClick={() => onSelectRecipe(selectedRecipeId, Number(servings) || 1)}>Hinzufügen</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
