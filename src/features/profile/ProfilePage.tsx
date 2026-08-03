import { useEffect, useState, type FormEvent } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useAuth } from '../auth/AuthContext'
import { useProfile, useUpdateProfile } from './useProfile'
import { CalorieCalculator } from './CalorieCalculator'
import { macroCaloriePercentages } from '../../lib/nutrition'

export function ProfilePage() {
  const { user } = useAuth()
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

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const percentages = macroCaloriePercentages(
    { protein: Number(proteinGoal) || 0, fat: Number(fatGoal) || 0, carbs: Number(carbsGoal) || 0 },
    Number(calorieGoal) || 0,
  )

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>👤</span> Profil & Ziele
      </h1>

      <Card className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-900">{user?.email}</p>
            {memberSince && <p className="text-xs text-gray-500">Mitglied seit {memberSince}</p>}
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Konto</span>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Wie sollen wir dich nennen?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Tagesziele</p>

            <div className="mb-3">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <span>🔥</span> Kalorien (kcal)
              </label>
              <input
                type="number"
                min="0"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="mb-3">
              <CalorieCalculator onApply={(kcal) => setCalorieGoal(String(kcal))} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-blue-700">
                  <span>🥩</span> Protein
                </label>
                <input
                  type="number"
                  min="0"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                {percentages.protein > 0 && <p className="mt-1 text-[11px] text-gray-400">{percentages.protein}% der kcal</p>}
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-amber-700">
                  <span>🥑</span> Fett
                </label>
                <input
                  type="number"
                  min="0"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                />
                {percentages.fat > 0 && <p className="mt-1 text-[11px] text-gray-400">{percentages.fat}% der kcal</p>}
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-purple-700">
                  <span>🌾</span> Kohlenh.
                </label>
                <input
                  type="number"
                  min="0"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
                {percentages.carbs > 0 && <p className="mt-1 text-[11px] text-gray-400">{percentages.carbs}% der kcal</p>}
              </div>
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
