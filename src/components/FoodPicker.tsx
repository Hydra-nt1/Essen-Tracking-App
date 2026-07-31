import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useFoods } from '../features/foods/useFoods'
import { useImportOpenFoodFactsFood } from '../features/foods/useImportOpenFoodFactsFood'
import { searchFoodsByName, type OpenFoodFactsResult } from '../lib/openFoodFacts'
import type { Food } from '../types/database'

type Tab = 'own' | 'off'

interface FoodPickerProps {
  onSelect: (food: Food, quantityG: number) => void
  submitLabel?: string
}

export function FoodPicker({ onSelect, submitLabel = 'Hinzufügen' }: FoodPickerProps) {
  const [tab, setTab] = useState<Tab>('own')
  const [ownSearch, setOwnSearch] = useState('')
  const [offSearch, setOffSearch] = useState('')
  const [offResults, setOffResults] = useState<OpenFoodFactsResult[]>([])
  const [offLoading, setOffLoading] = useState(false)
  const [offError, setOffError] = useState<string | null>(null)

  const [selectedOwnFood, setSelectedOwnFood] = useState<Food | null>(null)
  const [selectedOffProduct, setSelectedOffProduct] = useState<OpenFoodFactsResult | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [importing, setImporting] = useState(false)

  const { data: ownFoods, isLoading: ownLoading } = useFoods(ownSearch)
  const importOffFood = useImportOpenFoodFactsFood()

  async function handleOffSearch(e: FormEvent) {
    e.preventDefault()
    if (!offSearch.trim()) return
    setOffLoading(true)
    setOffError(null)
    try {
      const results = await searchFoodsByName(offSearch.trim())
      setOffResults(results)
    } catch {
      setOffError('Suche fehlgeschlagen. Bitte später erneut versuchen.')
    } finally {
      setOffLoading(false)
    }
  }

  async function handleConfirm() {
    const quantityG = Number(quantity)
    if (!quantityG || quantityG <= 0) return

    if (selectedOwnFood) {
      onSelect(selectedOwnFood, quantityG)
      return
    }
    if (selectedOffProduct) {
      setImporting(true)
      try {
        const food = await importOffFood.mutateAsync(selectedOffProduct)
        onSelect(food, quantityG)
      } finally {
        setImporting(false)
      }
    }
  }

  const hasSelection = !!selectedOwnFood || !!selectedOffProduct

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab('own')}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tab === 'own' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Meine Lebensmittel
        </button>
        <button
          type="button"
          onClick={() => setTab('off')}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tab === 'off' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Open Food Facts
        </button>
      </div>

      {tab === 'own' && (
        <div>
          <input
            value={ownSearch}
            onChange={(e) => setOwnSearch(e.target.value)}
            placeholder="Suchen..."
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
          {ownLoading && <p className="text-sm text-gray-500">Lädt...</p>}
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {ownFoods?.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => {
                  setSelectedOwnFood(food)
                  setSelectedOffProduct(null)
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedOwnFood?.id === food.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-900">{food.name}</span>{' '}
                <span className="text-gray-500">· {Math.round(food.calories_per_100g)} kcal/100g</span>
              </button>
            ))}
            {ownFoods?.length === 0 && !ownLoading && (
              <p className="text-sm text-gray-500">Keine Treffer.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'off' && (
        <div>
          <form onSubmit={handleOffSearch} className="mb-2 flex gap-2">
            <input
              value={offSearch}
              onChange={(e) => setOffSearch(e.target.value)}
              placeholder="z.B. Nutella"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
            <Button type="submit" variant="secondary" disabled={offLoading}>
              {offLoading ? '...' : 'Suchen'}
            </Button>
          </form>
          {offError && <p className="text-sm text-red-600">{offError}</p>}
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {offResults.map((product) => (
              <button
                key={product.barcode}
                type="button"
                onClick={() => {
                  setSelectedOffProduct(product)
                  setSelectedOwnFood(null)
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedOffProduct?.barcode === product.barcode
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-900">{product.name}</span>
                {product.brand && <span className="text-gray-500"> ({product.brand})</span>}{' '}
                <span className="text-gray-500">· {Math.round(product.calories_per_100g)} kcal/100g</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSelection && (
        <div className="mt-4 flex items-end gap-3 border-t border-gray-100 pt-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Menge (g)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <Button onClick={handleConfirm} disabled={importing}>
            {importing ? '...' : submitLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
