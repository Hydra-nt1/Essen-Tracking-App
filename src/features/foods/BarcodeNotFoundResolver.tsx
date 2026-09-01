import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { searchFoodsByName, type OpenFoodFactsResult } from '../../lib/openFoodFacts'
import { useCreateFood, type NewFood } from './useFoods'
import { FoodForm } from './FoodForm'
import type { Food } from '../../types/database'

interface BarcodeNotFoundResolverProps {
  barcode: string
  onCreated: (food: Food) => void
  onCancel: () => void
}

export function BarcodeNotFoundResolver({ barcode, onCreated, onCancel }: BarcodeNotFoundResolverProps) {
  const createFood = useCreateFood()
  const [nameQuery, setNameQuery] = useState('')
  const [results, setResults] = useState<OpenFoodFactsResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [prefill, setPrefill] = useState<Partial<NewFood> | null>(null)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!nameQuery.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      setResults(await searchFoodsByName(nameQuery.trim()))
    } catch {
      setSearchError('Suche fehlgeschlagen. Bitte später erneut versuchen.')
    } finally {
      setSearching(false)
    }
  }

  function pickResult(product: OpenFoodFactsResult) {
    setPrefill({
      name: product.name,
      brand: product.brand,
      barcode,
      calories_per_100g: product.calories_per_100g,
      protein_per_100g: product.protein_per_100g,
      fat_per_100g: product.fat_per_100g,
      carbs_per_100g: product.carbs_per_100g,
      source: 'openfoodfacts',
    })
  }

  if (prefill) {
    return (
      <div>
        <p className="mb-2 text-sm text-gray-600">Werte prüfen und speichern:</p>
        <FoodForm
          initial={prefill}
          submitLabel="Anlegen & auswählen"
          onSubmit={async (food) => {
            const created = await createFood.mutateAsync(food)
            onCreated(created)
          }}
        />
        <button type="button" onClick={() => setPrefill(null)} className="mt-2 text-xs text-gray-500 hover:underline">
          Zurück zur Suche
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm text-gray-600">
        Barcode <span className="font-mono">{barcode}</span> wurde nicht automatisch gefunden. Nach Namen in der
        Lebensmitteldatenbank suchen, um Nährwerte zu übernehmen:
      </p>
      <form onSubmit={handleSearch} className="mb-2 flex gap-2">
        <input
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="Produktname eingeben"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
        />
        <Button type="submit" variant="secondary" disabled={searching}>
          {searching ? '...' : 'Suchen'}
        </Button>
      </form>
      {searchError && <p className="mb-2 text-sm text-red-600">{searchError}</p>}
      {results.length > 0 && (
        <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.barcode}
              type="button"
              onClick={() => pickResult(product)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{product.name}</span>
              {product.brand && <span className="text-gray-500"> ({product.brand})</span>}{' '}
              <span className="text-gray-500">· {Math.round(product.calories_per_100g)} kcal/100g</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setPrefill({ barcode })}
          className="text-sm font-medium text-green-700 hover:underline"
        >
          Stattdessen manuell anlegen
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:underline">
          Abbrechen
        </button>
      </div>
    </div>
  )
}
