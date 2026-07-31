import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import type { NewFood } from './useFoods'

interface FoodFormProps {
  initial?: Partial<NewFood>
  onSubmit: (food: NewFood) => Promise<void>
  submitLabel?: string
}

export function FoodForm({ initial, onSubmit, submitLabel = 'Speichern' }: FoodFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [calories, setCalories] = useState(initial?.calories_per_100g?.toString() ?? '')
  const [protein, setProtein] = useState(initial?.protein_per_100g?.toString() ?? '')
  const [fat, setFat] = useState(initial?.fat_per_100g?.toString() ?? '')
  const [carbs, setCarbs] = useState(initial?.carbs_per_100g?.toString() ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        name,
        brand: brand || null,
        barcode: initial?.barcode ?? null,
        calories_per_100g: Number(calories) || 0,
        protein_per_100g: Number(protein) || 0,
        fat_per_100g: Number(fat) || 0,
        carbs_per_100g: Number(carbs) || 0,
        source: initial?.source ?? 'custom',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Marke (optional)</label>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
        />
      </div>
      <p className="text-xs text-gray-500">Nährwerte pro 100 g</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Kalorien (kcal)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            required
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Protein (g)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fett (g)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Kohlenhydrate (g)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Speichern...' : submitLabel}
      </Button>
    </form>
  )
}
