import { lazy, Suspense, useCallback, useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useAuth } from '../features/auth/AuthContext'
import { findFoodByBarcode, useCreateFood, useFoods, type NewFood } from '../features/foods/useFoods'
import { BarcodeNotFoundResolver } from '../features/foods/BarcodeNotFoundResolver'
import { FoodForm } from '../features/foods/FoodForm'
import { getFoodByBarcode, searchFoodsByName, type OpenFoodFactsResult } from '../lib/openFoodFacts'
import type { Food } from '../types/database'

const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })))

type Tab = 'own' | 'off' | 'scan'

function toNewFoodInitial(product: OpenFoodFactsResult): Partial<NewFood> {
  return {
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    calories_per_100g: product.calories_per_100g,
    protein_per_100g: product.protein_per_100g,
    fat_per_100g: product.fat_per_100g,
    carbs_per_100g: product.carbs_per_100g,
    source: 'openfoodfacts',
  }
}

interface FoodPickerProps {
  onSelect: (food: Food, quantityG: number) => void
  submitLabel?: string
}

export function FoodPicker({ onSelect, submitLabel = 'Hinzufügen' }: FoodPickerProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('off')
  const [ownSearch, setOwnSearch] = useState('')
  const [offSearch, setOffSearch] = useState('')
  const [offResults, setOffResults] = useState<OpenFoodFactsResult[]>([])
  const [offLoading, setOffLoading] = useState(false)
  const [offError, setOffError] = useState<string | null>(null)

  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)

  const [reviewProduct, setReviewProduct] = useState<OpenFoodFactsResult | null>(null)
  const [selectedOwnFood, setSelectedOwnFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('100')

  const { data: ownFoods, isLoading: ownLoading } = useFoods(ownSearch)
  const createFood = useCreateFood()

  function switchTab(next: Tab) {
    setTab(next)
    setSelectedOwnFood(null)
    setReviewProduct(null)
    setScanError(null)
    setNotFoundBarcode(null)
  }

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

  async function handleOffPick(product: OpenFoodFactsResult) {
    const existing = await findFoodByBarcode(user!.id, product.barcode)
    if (existing) {
      setSelectedOwnFood(existing)
      setReviewProduct(null)
      return
    }
    setSelectedOwnFood(null)
    setReviewProduct(product)
  }

  const handleBarcodeDetected = useCallback(
    async (code: string) => {
      setScanLoading(true)
      setScanError(null)
      setNotFoundBarcode(null)
      try {
        const ownMatch = await findFoodByBarcode(user!.id, code)
        if (ownMatch) {
          setSelectedOwnFood(ownMatch)
          setReviewProduct(null)
          return
        }
        const product = await getFoodByBarcode(code)
        if (product) {
          setSelectedOwnFood(null)
          setReviewProduct(product)
          return
        }
        setNotFoundBarcode(code)
      } catch {
        setScanError('Abfrage fehlgeschlagen. Bitte später erneut versuchen.')
      } finally {
        setScanLoading(false)
      }
    },
    [user],
  )

  async function handleReviewSubmit(food: NewFood) {
    const created = await createFood.mutateAsync(food)
    setSelectedOwnFood(created)
    setReviewProduct(null)
  }

  function handleConfirm() {
    const quantityG = Number(quantity)
    if (!quantityG || quantityG <= 0 || !selectedOwnFood) return
    onSelect(selectedOwnFood, quantityG)
  }

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => switchTab('off')}
          className={`flex-1 rounded-md px-2 py-1.5 font-medium ${tab === 'off' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Online suchen
        </button>
        <button
          type="button"
          onClick={() => switchTab('own')}
          className={`flex-1 rounded-md px-2 py-1.5 font-medium ${tab === 'own' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Meine Lebensmittel
        </button>
        <button
          type="button"
          onClick={() => switchTab('scan')}
          className={`flex-1 rounded-md px-2 py-1.5 font-medium ${tab === 'scan' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          📷 Scannen
        </button>
      </div>

      {tab === 'off' && !reviewProduct && (
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
                onClick={() => handleOffPick(product)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{product.name}</span>
                {product.brand && <span className="text-gray-500"> ({product.brand})</span>}{' '}
                <span className="text-gray-500">· {Math.round(product.calories_per_100g)} kcal/100g</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  setReviewProduct(null)
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

      {tab === 'scan' && (
        <div>
          {!selectedOwnFood && !reviewProduct && !scanLoading && !scanError && !notFoundBarcode && (
            <Suspense fallback={<p className="text-sm text-gray-500">Lädt Scanner...</p>}>
              <BarcodeScanner onDetected={handleBarcodeDetected} />
            </Suspense>
          )}
          {scanLoading && <p className="text-sm text-gray-500">Suche Produkt...</p>}
          {scanError && (
            <div>
              <p className="text-sm text-red-600">{scanError}</p>
              <button
                type="button"
                onClick={() => setScanError(null)}
                className="mt-2 text-sm font-medium text-green-700 hover:underline"
              >
                Erneut scannen
              </button>
            </div>
          )}
          {notFoundBarcode && (
            <BarcodeNotFoundResolver
              barcode={notFoundBarcode}
              onCreated={(food) => {
                setSelectedOwnFood(food)
                setNotFoundBarcode(null)
              }}
              onCancel={() => setNotFoundBarcode(null)}
            />
          )}
          {selectedOwnFood && !reviewProduct && (
            <div className="flex items-center justify-between rounded-lg border border-green-500 bg-green-50 px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-gray-900">{selectedOwnFood.name}</span>
                {selectedOwnFood.brand && <span className="text-gray-500"> ({selectedOwnFood.brand})</span>}{' '}
                <span className="text-gray-500">· {Math.round(selectedOwnFood.calories_per_100g)} kcal/100g</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedOwnFood(null)}
                className="shrink-0 text-xs text-gray-500 hover:underline"
              >
                Anderen scannen
              </button>
            </div>
          )}
        </div>
      )}

      {reviewProduct && (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            Angaben aus der Datenbank prüfen (z.B. bei Tippfehlern in Name/Marke) und speichern:
          </p>
          <FoodForm initial={toNewFoodInitial(reviewProduct)} submitLabel="Übernehmen" onSubmit={handleReviewSubmit} />
          <button
            type="button"
            onClick={() => setReviewProduct(null)}
            className="mt-2 text-xs text-gray-500 hover:underline"
          >
            Abbrechen
          </button>
        </div>
      )}

      {selectedOwnFood && !reviewProduct && (
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
          <Button onClick={handleConfirm}>{submitLabel}</Button>
        </div>
      )}
    </div>
  )
}
