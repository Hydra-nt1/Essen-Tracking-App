import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { useCreateFood, useDeleteFood, useFoods } from './useFoods'
import { FoodForm } from './FoodForm'

export function FoodLibraryPage() {
  const [search, setSearch] = useState('')
  const { data: foods, isLoading } = useFoods(search)
  const createFood = useCreateFood()
  const deleteFood = useDeleteFood()
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <span>🍎</span> Meine Lebensmittel
        </h1>
        <Button onClick={() => setShowAddModal(true)}>+ Lebensmittel</Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen..."
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
      />

      {isLoading && <p className="text-gray-500">Lädt...</p>}
      {!isLoading && foods?.length === 0 && (
        <p className="text-gray-500">Noch keine Lebensmittel angelegt.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {foods?.map((food) => (
          <Card key={food.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{food.name}</p>
                {food.brand && <p className="text-xs text-gray-500">{food.brand}</p>}
              </div>
              <button
                onClick={() => deleteFood.mutate(food.id)}
                className="shrink-0 text-xs text-red-500 hover:underline"
              >
                Löschen
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                {Math.round(food.calories_per_100g)} kcal
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                P {Math.round(food.protein_per_100g)}g
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                F {Math.round(food.fat_per_100g)}g
              </span>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
                KH {Math.round(food.carbs_per_100g)}g
              </span>
            </div>
            <p className="text-[11px] text-gray-400">pro 100 g · {food.source === 'custom' ? 'eigene Angabe' : 'Open Food Facts'}</p>
          </Card>
        ))}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Lebensmittel anlegen">
        <FoodForm
          onSubmit={async (food) => {
            await createFood.mutateAsync(food)
            setShowAddModal(false)
          }}
        />
      </Modal>
    </div>
  )
}
