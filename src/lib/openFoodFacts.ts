const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'

export interface OpenFoodFactsResult {
  barcode: string
  name: string
  brand: string | null
  calories_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
}

interface RawOffNutriments {
  'energy-kcal_100g'?: number
  proteins_100g?: number
  fat_100g?: number
  carbohydrates_100g?: number
}

interface RawOffProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: RawOffNutriments
}

function mapProduct(raw: RawOffProduct): OpenFoodFactsResult | null {
  if (!raw.code || !raw.product_name) return null
  const n = raw.nutriments ?? {}
  if (n['energy-kcal_100g'] == null) return null

  return {
    barcode: raw.code,
    name: raw.product_name,
    brand: raw.brands?.split(',')[0]?.trim() || null,
    calories_per_100g: n['energy-kcal_100g'] ?? 0,
    protein_per_100g: n.proteins_100g ?? 0,
    fat_per_100g: n.fat_100g ?? 0,
    carbs_per_100g: n.carbohydrates_100g ?? 0,
  }
}

export async function searchFoodsByName(query: string): Promise<OpenFoodFactsResult[]> {
  const url = new URL(SEARCH_URL)
  url.searchParams.set('search_terms', query)
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', '20')
  url.searchParams.set(
    'fields',
    'code,product_name,brands,nutriments',
  )

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Open Food Facts Suche fehlgeschlagen')

  const data = (await response.json()) as { products?: RawOffProduct[] }
  return (data.products ?? [])
    .map(mapProduct)
    .filter((p): p is OpenFoodFactsResult => p !== null)
}

export async function getFoodByBarcode(barcode: string): Promise<OpenFoodFactsResult | null> {
  const url = `${PRODUCT_URL}/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,nutriments`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Produkt konnte nicht geladen werden')

  const data = (await response.json()) as { status: number; product?: RawOffProduct }
  if (data.status !== 1 || !data.product) return null
  return mapProduct(data.product)
}
