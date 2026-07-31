import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { useFoods } from '../foods/useFoods'

interface IngredientRow {
  food_id: string
  quantity_g: string
}

interface RecipeFormProps {
  onSubmit: (recipe: { name: string; servings: number; ingredients: { food_id: string; quantity_g: number }[] }) => Promise<void>
}

export function RecipeForm({ onSubmit }: RecipeFormProps) {
  const { data: foods } = useFoods()
  const [name, setName] = useState('')
  const [servings, setServings] = useState('1')
  const [rows, setRows] = useState<IngredientRow[]>([{ food_id: '', quantity_g: '' }])
  const [submitting, setSubmitting] = useState(false)

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ingredients = rows
      .filter((r) => r.food_id && Number(r.quantity_g) > 0)
      .map((r) => ({ food_id: r.food_id, quantity_g: Number(r.quantity_g) }))
    if (!name || ingredients.length === 0) return

    setSubmitting(true)
    try {
      await onSubmit({ name, servings: Number(servings) || 1, ingredients })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Rezeptname</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Portionen</label>
        <input
          type="number"
          min="1"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Zutaten</p>
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={row.food_id}
                onChange={(e) => updateRow(index, { food_id: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">Lebensmittel wählen...</option>
                {foods?.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="g"
                value={row.quantity_g}
                onChange={(e) => updateRow(index, { quantity_g: e.target.value })}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              <button type="button" onClick={() => removeRow(index)} className="text-xs text-red-500 hover:underline">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { food_id: '', quantity_g: '' }])}
          className="mt-2 text-sm font-medium text-green-700 hover:underline"
        >
          + Zutat
        </button>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Speichern...' : 'Rezept speichern'}
      </Button>
    </form>
  )
}
