import { lazy, Suspense, useCallback, useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useAuth } from '../features/auth/AuthContext'
import { findFoodByBarcode, useCreateFood, useFoods, type NewFood } from '../features/foods/useFoods'
import { useFrequentFoodsForMeal } from '../features/diary/useDiary'
import { BarcodeNotFoundResolver } from '../features/foods/BarcodeNotFoundResolver'
import { FoodForm } from '../features/foods/FoodForm'
import { getFoodByBarcode, searchFoodsByName, type OpenFoodFactsResult } from '../lib/openFoodFacts'
import { createSpeechRecognition } from '../lib/speechRecognition'
import type { Food, MealType } from '../types/database'

const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })))

type Mode = 'search' | 'scan'

const mealLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snacks',
}

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
  mealType?: MealType
  submitLabel?: string
}

export function FoodPicker({ onSelect, mealType, submitLabel = 'Hinzufügen' }: FoodPickerProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('search')
  const [ownSearch, setOwnSearch] = useState('')
  const [offResults, setOffResults] = useState<OpenFoodFactsResult[] | null>(null)
  const [offLoading, setOffLoading] = useState(false)
  const [offError, setOffError] = useState<string | null>(null)

  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)

  const [reviewProduct, setReviewProduct] = useState<OpenFoodFactsResult | null>(null)
  const [selectedOwnFood, setSelectedOwnFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const { data: ownFoods, isLoading: ownLoading } = useFoods(ownSearch)
  const { data: frequentFoods, isLoading: frequentLoading } = useFrequentFoodsForMeal(mealType)
  const createFood = useCreateFood()

  function switchMode(next: Mode) {
    setMode(next)
    setSelectedOwnFood(null)
    setReviewProduct(null)
    setScanError(null)
    setNotFoundBarcode(null)
  }

  async function handleOffSearch(e: FormEvent) {
    e.preventDefault()
    if (!ownSearch.trim()) return
    setOffLoading(true)
    setOffError(null)
    try {
      setOffResults(await searchFoodsByName(ownSearch.trim()))
    } catch {
      setOffError('Suche fehlgeschlagen. Bitte später erneut versuchen.')
    } finally {
      setOffLoading(false)
    }
  }

  function startVoiceSearch() {
    const recognition = createSpeechRecognition()
    if (!recognition) {
      setVoiceError('Spracheingabe wird von diesem Browser nicht unterstützt.')
      return
    }
    setVoiceError(null)
    recognition.lang = 'de-DE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setOwnSearch(transcript)
        setOffResults(null)
      }
    }
    recognition.onerror = () => {
      setListening(false)
      setVoiceError('Spracheingabe fehlgeschlagen. Bitte erneut versuchen oder tippen.')
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
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

  const showFrequent = !ownSearch.trim() && !offResults && mealType

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => switchMode('search')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
            mode === 'search' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600'
          }`}
        >
          <span className="text-xl">🔍</span>
          Suche
        </button>
        <button
          type="button"
          onClick={() => switchMode('scan')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
            mode === 'scan' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600'
          }`}
        >
          <span className="text-xl">📷</span>
          Scannen
        </button>
      </div>

      {mode === 'search' && !reviewProduct && (
        <div>
          <form onSubmit={handleOffSearch} className="mb-1 flex gap-2">
            <input
              value={ownSearch}
              onChange={(e) => {
                setOwnSearch(e.target.value)
                setOffResults(null)
                setOffError(null)
              }}
              placeholder={mealType ? `Was hattest du zum ${mealLabels[mealType]}?` : 'Lebensmittel suchen...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              disabled={listening}
              aria-label="Spracheingabe"
              className={`shrink-0 rounded-lg border px-3 text-lg ${
                listening ? 'animate-pulse border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              🎤
            </button>
          </form>
          {voiceError && <p className="mb-2 text-xs text-red-600">{voiceError}</p>}

          {showFrequent && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Häufig bei {mealLabels[mealType]}
              </p>
              {frequentLoading && <p className="text-sm text-gray-500">Lädt...</p>}
              {!frequentLoading && frequentFoods?.length === 0 && (
                <p className="text-sm text-gray-400">Noch keine Historie für diese Mahlzeit.</p>
              )}
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {frequentFoods?.map(({ food, lastQuantityG }) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{food.name}</span>
                      <span className="text-gray-500">
                        {' '}
                        · {lastQuantityG}g ({Math.round((food.calories_per_100g * lastQuantityG) / 100)} kcal)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(food, lastQuantityG)}
                      aria-label={`${food.name} hinzufügen`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-green-500 text-lg leading-none text-green-600 hover:bg-green-50"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ownSearch.trim() && !offResults && (
            <div className="mb-3">
              {ownLoading && <p className="text-sm text-gray-500">Lädt...</p>}
              <div className="max-h-56 space-y-1 overflow-y-auto">
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
                  <p className="text-sm text-gray-500">Keine Treffer in deiner Bibliothek.</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleOffSearch}
                disabled={offLoading}
                className="mt-2 text-sm font-medium text-green-700 hover:underline"
              >
                {offLoading ? 'Suche online...' : 'Auch online durchsuchen →'}
              </button>
            </div>
          )}

          {offResults && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Online-Ergebnisse</p>
                <button
                  type="button"
                  onClick={() => setOffResults(null)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Zurück
                </button>
              </div>
              {offError && <p className="text-sm text-red-600">{offError}</p>}
              <div className="max-h-56 space-y-1 overflow-y-auto">
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
                {offResults.length === 0 && <p className="text-sm text-gray-500">Keine Online-Treffer.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'scan' && (
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
