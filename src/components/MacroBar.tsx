interface MacroBarProps {
  label: string
  value: number
  goal: number | null
  unit: string
  colorClass: string
}

export function MacroBar({ label, value, goal, unit, colorClass }: MacroBarProps) {
  const percent = goal ? Math.min(100, (value / goal) * 100) : 0

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {Math.round(value)} {unit}
          {goal ? ` / ${Math.round(goal)} ${unit}` : ''}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
