import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { MacroBar } from '../../components/MacroBar'
import { formatDateLabel, todayKey } from '../../lib/date'
import { macrosForQuantity, sumMacros } from '../../lib/nutrition'
import { useDiaryEntries } from '../diary/useDiary'
import { useProfile } from '../profile/useProfile'

export function DashboardPage() {
  const date = todayKey()
  const { data: entries, isLoading: entriesLoading } = useDiaryEntries(date)
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (entriesLoading || profileLoading) return <p className="text-gray-500">Lädt...</p>

  const totals = sumMacros((entries ?? []).map((e) => macrosForQuantity(e.food, e.quantity_g)))

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Übersicht – {formatDateLabel(date)}</h1>

      <Card className="max-w-md space-y-4">
        <MacroBar label="Kalorien" value={totals.calories} goal={profile?.daily_calorie_goal ?? null} unit="kcal" colorClass="bg-green-500" />
        <MacroBar label="Protein" value={totals.protein} goal={profile?.protein_goal_g ?? null} unit="g" colorClass="bg-blue-500" />
        <MacroBar label="Fett" value={totals.fat} goal={profile?.fat_goal_g ?? null} unit="g" colorClass="bg-amber-500" />
        <MacroBar label="Kohlenhydrate" value={totals.carbs} goal={profile?.carbs_goal_g ?? null} unit="g" colorClass="bg-purple-500" />

        {!profile?.daily_calorie_goal && (
          <p className="text-xs text-gray-500">
            Noch keine Ziele gesetzt.{' '}
            <Link to="/profile" className="text-green-600 hover:underline">
              Jetzt im Profil festlegen
            </Link>
            .
          </p>
        )}
      </Card>

      <div className="mt-6">
        <Link to="/diary" className="text-sm font-medium text-green-700 hover:underline">
          Zum Tagebuch →
        </Link>
      </div>
    </div>
  )
}
