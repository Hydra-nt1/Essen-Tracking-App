import { lazy, Suspense, useCallback, useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useAuth } from '../features/auth/AuthContext'
import { findFoodByBarcode, useCreateFood, useFoods } from '../features/foods/useFoods'
import { useImportOpenFoodFactsFood } from '../features/foods/useImportOpenFoodFactsFood'
import { FoodForm } from '../features/foods/FoodForm'
import { getFoodByBarcode, searchFoodsByName, type OpenFoodFactsResult } from '../lib/openFoodFacts'
import type { Food } from '../types/database'

const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })))

type Tab = 'own' | 'off' | 'scan'

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

  const [selectedOwnFood, setSelectedOwnFood] = useState<Food | null>(null)
  const [selectedOffProduct, setSelectedOffProduct] = useState<OpenFoodFactsResult | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [importing, setImporting] = useState(false)

  const { data: ownFoods, isLoading: ownLoading } = useFoods(ownSearch)
  const importOffFood = useImportOpenFoodFactsFood()
  const createFood = useCreateFood()

  function switchTab(next: Tab) {
    setTab(next)
    setSelectedOwnFood(null)
    setSelectedOffProduct(null)
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

  const handleBarcodeDetected = useCallback(
    async (code: string) => {
      setScanLoading(true)
      setScanError(null)
      setNotFoundBarcode(null)
      try {
        const ownMatch = await findFoodByBarcode(user!.id, code)
        if (ownMatch) {
          setSelectedOwnFood(ownMatch)
          setSelectedOffProduct(null)
          return
        }
        const product = await getFoodByBarcode(code)
        if (product) {
          setSelectedOffProduct(product)
          setSelectedOwnFood(null)
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
  const scanResult = selectedOwnFood ?? selectedOffProduct

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

      {tab === 'scan' && (
        <div>
          {!scanResult && !scanLoading && !scanError && !notFoundBarcode && (
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
            <div>
              <p className="mb-2 text-sm text-gray-600">
                Kein Produkt für Barcode <span className="font-mono">{notFoundBarcode}</span> gefunden. Leg es einmal
                an, dann wird es beim nächsten Scan sofort erkannt:
              </p>
              <FoodForm
                initial={{ barcode: notFoundBarcode }}
                submitLabel="Anlegen & auswählen"
                onSubmit={async (food) => {
                  const created = await createFood.mutateAsync(food)
                  setSelectedOwnFood(created)
                  setNotFoundBarcode(null)
                }}
              />
              <button
                type="button"
                onClick={() => setNotFoundBarcode(null)}
                className="mt-2 text-xs text-gray-500 hover:underline"
              >
                Abbrechen, erneut scannen
              </button>
            </div>
          )}
          {scanResult && (
            <div className="flex items-center justify-between rounded-lg border border-green-500 bg-green-50 px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-gray-900">{scanResult.name}</span>
                {scanResult.brand && <span className="text-gray-500"> ({scanResult.brand})</span>}{' '}
                <span className="text-gray-500">· {Math.round(scanResult.calories_per_100g)} kcal/100g</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedOwnFood(null)
                  setSelectedOffProduct(null)
                }}
                className="shrink-0 text-xs text-gray-500 hover:underline"
              >
                Anderen scannen
              </button>
            </div>
          )}
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
