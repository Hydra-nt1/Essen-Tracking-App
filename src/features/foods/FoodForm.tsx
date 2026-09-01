import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
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
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setOcrLoading(true)
    setOcrMessage(null)
    try {
      const [{ recognizeText }, { parseNutritionLabel }] = await Promise.all([
        import('../../lib/ocr'),
        import('../../lib/nutritionLabelParser'),
      ])
      const text = await recognizeText(file)
      const parsed = parseNutritionLabel(text)
      const found: string[] = []
      if (parsed.calories !== undefined) {
        setCalories(String(parsed.calories))
        found.push('Kalorien')
      }
      if (parsed.protein !== undefined) {
        setProtein(String(parsed.protein))
        found.push('Protein')
      }
      if (parsed.fat !== undefined) {
        setFat(String(parsed.fat))
        found.push('Fett')
      }
      if (parsed.carbs !== undefined) {
        setCarbs(String(parsed.carbs))
        found.push('Kohlenhydrate')
      }
      setOcrMessage(
        found.length > 0
          ? `Erkannt: ${found.join(', ')} — bitte prüfen.`
          : 'Nährwerttabelle konnte nicht erkannt werden. Bitte manuell eingeben.',
      )
    } catch {
      setOcrMessage('Texterkennung fehlgeschlagen. Bitte manuell eingeben.')
    } finally {
      setOcrLoading(false)
    }
  }

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
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Nährwerte pro 100 g</p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
          >
            {ocrLoading ? 'Lese Nährwerttabelle...' : '📷 Aus Foto übernehmen'}
          </button>
        </div>
      </div>
      {ocrMessage && <p className="text-xs text-gray-500">{ocrMessage}</p>}
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
