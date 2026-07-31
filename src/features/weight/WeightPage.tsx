import { useState, type FormEvent } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { todayKey } from '../../lib/date'
import { useDeleteWeightEntry, useUpsertWeightEntry, useWeightEntries } from './useWeight'

export function WeightPage() {
  const { data: entries, isLoading } = useWeightEntries()
  const upsertEntry = useUpsertWeightEntry()
  const deleteEntry = useDeleteWeightEntry()

  const [date, setDate] = useState(todayKey())
  const [weight, setWeight] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const weightKg = Number(weight)
    if (!weightKg) return
    await upsertEntry.mutateAsync({ date, weight_kg: weightKg })
    setWeight('')
  }

  const chartData = (entries ?? []).map((e) => ({ date: e.date, weight: e.weight_kg }))

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Gewichtsverlauf</h1>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gewicht (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={upsertEntry.isPending}>
            {upsertEntry.isPending ? 'Speichern...' : 'Eintragen'}
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-gray-500">Lädt...</p>}

      {!isLoading && chartData.length > 0 && (
        <Card className="mb-6">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} unit="kg" />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {!isLoading && entries && entries.length > 0 && (
        <Card>
          <ul className="divide-y divide-gray-100">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{entry.date}</span>
                <span className="font-medium text-gray-900">{entry.weight_kg} kg</span>
                <button onClick={() => deleteEntry.mutate(entry.id)} className="text-xs text-red-500 hover:underline">
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!isLoading && entries?.length === 0 && <p className="text-gray-500">Noch keine Einträge.</p>}
    </div>
  )
}
