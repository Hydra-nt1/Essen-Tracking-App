import { useEffect, useState, type FormEvent } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useProfile, useUpdateProfile } from './useProfile'

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')
  const [proteinGoal, setProteinGoal] = useState('')
  const [fatGoal, setFatGoal] = useState('')
  const [carbsGoal, setCarbsGoal] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setCalorieGoal(profile.daily_calorie_goal?.toString() ?? '')
    setProteinGoal(profile.protein_goal_g?.toString() ?? '')
    setFatGoal(profile.fat_goal_g?.toString() ?? '')
    setCarbsGoal(profile.carbs_goal_g?.toString() ?? '')
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    await updateProfile.mutateAsync({
      display_name: displayName || null,
      daily_calorie_goal: calorieGoal ? Number(calorieGoal) : null,
      protein_goal_g: proteinGoal ? Number(proteinGoal) : null,
      fat_goal_g: fatGoal ? Number(fatGoal) : null,
      carbs_goal_g: carbsGoal ? Number(carbsGoal) : null,
    })
    setSaved(true)
  }

  if (isLoading) return <p className="text-gray-500">Lädt...</p>

  return (
    <div className="max-w-md">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>👤</span> Profil & Ziele
      </h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tagesziel Kalorien (kcal)</label>
            <input
              type="number"
              min="0"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fett (g)</label>
              <input
                type="number"
                min="0"
                value={fatGoal}
                onChange={(e) => setFatGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kohlenhydrate (g)</label>
              <input
                type="number"
                min="0"
                value={carbsGoal}
                onChange={(e) => setCarbsGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
            {saved && <span className="text-sm text-green-600">Gespeichert!</span>}
          </div>
        </form>
      </Card>
    </div>
  )
}
