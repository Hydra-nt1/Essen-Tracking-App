import { useState, type FormEvent } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { addDays, formatDateLabel, startOfWeek, todayKey } from '../../lib/date'
import {
  useAddShoppingListItem,
  useClearCheckedItems,
  useDeleteShoppingListItem,
  useGenerateFromMealPlan,
  useShoppingListItems,
  useToggleShoppingListItem,
} from './useShoppingList'

export function ShoppingListPage() {
  const { data: items, isLoading } = useShoppingListItems()
  const addItem = useAddShoppingListItem()
  const toggleItem = useToggleShoppingListItem()
  const deleteItem = useDeleteShoppingListItem()
  const clearChecked = useClearCheckedItems()
  const generateFromPlan = useGenerateFromMealPlan()

  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()))
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await addItem.mutateAsync({ name: name.trim(), quantity: quantity ? Number(quantity) : null, unit: unit || null })
    setName('')
    setQuantity('')
    setUnit('')
  }

  const open = items?.filter((i) => !i.is_checked) ?? []
  const checked = items?.filter((i) => i.is_checked) ?? []

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>🛒</span> Einkaufsliste
      </h1>

      <Card className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Aus Wochenplan generieren</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ←
          </Button>
          <span className="text-sm text-gray-600">
            {formatDateLabel(weekStart)} – {formatDateLabel(addDays(weekStart, 6))}
          </span>
          <Button variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            →
          </Button>
          <Button
            variant="secondary"
            onClick={() => generateFromPlan.mutate(weekStart)}
            disabled={generateFromPlan.isPending}
          >
            {generateFromPlan.isPending ? 'Generiere...' : 'Generieren'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Ersetzt zuvor automatisch generierte Einträge. Manuell hinzugefügte Einträge bleiben erhalten.
        </p>
      </Card>

      <Card className="mb-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Artikel</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Menge</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Einheit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="g, Stk..."
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <Button type="submit">+ Hinzufügen</Button>
        </form>
      </Card>

      {isLoading && <p className="text-gray-500">Lädt...</p>}

      <Card>
        {open.length === 0 && checked.length === 0 && <p className="text-gray-500">Die Einkaufsliste ist leer.</p>}
        <ul className="divide-y divide-gray-100">
          {open.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={(e) => toggleItem.mutate({ id: item.id, is_checked: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="flex-1 text-sm text-gray-800">
                {item.name}
                {item.quantity ? ` – ${item.quantity}${item.unit ?? ''}` : ''}
              </span>
              <button onClick={() => deleteItem.mutate(item.id)} className="text-xs text-red-500 hover:underline">
                Löschen
              </button>
            </li>
          ))}
        </ul>

        {checked.length > 0 && (
          <>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500">Erledigt</p>
              <button onClick={() => clearChecked.mutate()} className="text-xs text-gray-500 hover:underline">
                Erledigte löschen
              </button>
            </div>
            <ul className="divide-y divide-gray-100">
              {checked.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={(e) => toggleItem.mutate({ id: item.id, is_checked: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="flex-1 text-sm text-gray-400 line-through">
                    {item.name}
                    {item.quantity ? ` – ${item.quantity}${item.unit ?? ''}` : ''}
                  </span>
                  <button onClick={() => deleteItem.mutate(item.id)} className="text-xs text-red-500 hover:underline">
                    Löschen
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
