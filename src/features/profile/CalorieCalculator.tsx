import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import {
  activityLabels,
  applyGoalToTdee,
  calculateTdee,
  goalRateLabels,
  weightGoalLabels,
  type ActivityLevel,
  type Gender,
  type GoalAdjustedTargets,
  type GoalRate,
  type WeightGoal,
} from '../../lib/nutrition'

const STORAGE_KEY = 'foodtracker_calorie_calculator'

interface CalculatorState {
  gender: Gender
  age: string
  heightCm: string
  weightKg: string
  activity: ActivityLevel
  goal: WeightGoal
  rate: GoalRate
}

const defaultState: CalculatorState = {
  gender: 'female',
  age: '',
  heightCm: '',
  weightKg: '',
  activity: 'light',
  goal: 'maintain',
  rate: 'moderate',
}

function loadState(): CalculatorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

export function CalorieCalculator({ onApply }: { onApply: (targets: GoalAdjustedTargets) => void }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<CalculatorState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const age = Number(state.age)
  const heightCm = Number(state.heightCm)
  const weightKg = Number(state.weightKg)
  const canCalculate = age > 0 && heightCm > 0 && weightKg > 0

  const tdee = canCalculate
    ? calculateTdee({ gender: state.gender, age, heightCm, weightKg, activity: state.activity })
    : null
  const targets = tdee !== null ? applyGoalToTdee(tdee, state.goal, state.rate) : null

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700"
      >
        <span>🧮 Kalorienziel berechnen</span>
        <span className="text-gray-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-100 px-3 py-3">
          <div className="flex gap-2">
            {(['female', 'male'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setState((s) => ({ ...s, gender: g }))}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  state.gender === g ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {g === 'female' ? 'Weiblich' : 'Männlich'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Alter</label>
              <input
                type="number"
                min="0"
                value={state.age}
                onChange={(e) => setState((s) => ({ ...s, age: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Größe (cm)</label>
              <input
                type="number"
                min="0"
                value={state.heightCm}
                onChange={(e) => setState((s) => ({ ...s, heightCm: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Gewicht (kg)</label>
              <input
                type="number"
                min="0"
                value={state.weightKg}
                onChange={(e) => setState((s) => ({ ...s, weightKg: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Aktivitätslevel</label>
            <select
              value={state.activity}
              onChange={(e) => setState((s) => ({ ...s, activity: e.target.value as ActivityLevel }))}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
            >
              {Object.entries(activityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Ziel</label>
            <div className="flex gap-2">
              {(Object.keys(weightGoalLabels) as WeightGoal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, goal: g }))}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                    state.goal === g ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {weightGoalLabels[g]}
                </button>
              ))}
            </div>
          </div>

          {state.goal !== 'maintain' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tempo</label>
              <select
                value={state.rate}
                onChange={(e) => setState((s) => ({ ...s, rate: e.target.value as GoalRate }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              >
                {Object.entries(goalRateLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targets !== null ? (
            <div className="rounded-lg bg-green-50 px-3 py-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-green-800">
                  Ziel: <strong>{targets.calories} kcal</strong>/Tag
                </span>
                <Button type="button" variant="secondary" onClick={() => onApply(targets)}>
                  Übernehmen
                </Button>
              </div>
              <p className="text-xs text-green-700">
                P {targets.protein}g · F {targets.fat}g · KH {targets.carbs}g
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Alter, Größe und Gewicht eingeben für eine Schätzung.</p>
          )}
        </div>
      )}
    </div>
  )
}
