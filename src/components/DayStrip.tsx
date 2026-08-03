import { addDays, startOfWeek, todayKey } from '../lib/date'

interface DayStripProps {
  selected: string
  onSelect: (date: string) => void
}

const weekdayFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'short' })

export function DayStrip({ selected, onSelect }: DayStripProps) {
  const weekStart = startOfWeek(selected)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayKey()
  const monthLabel = new Date(`${selected}T00:00:00`).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium capitalize text-gray-500">{monthLabel}</span>
        {selected !== today && (
          <button onClick={() => onSelect(today)} className="text-sm font-medium text-green-700 hover:underline">
            Heute
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onSelect(addDays(weekStart, -7))}
          aria-label="Vorherige Woche"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ‹
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = day === selected
            const isToday = day === today
            const date = new Date(`${day}T00:00:00`)
            return (
              <button
                key={day}
                onClick={() => onSelect(day)}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-2 ${
                  isSelected ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`text-[10px] uppercase ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                  {weekdayFormatter.format(date)}
                </span>
                <span className={`text-sm font-semibold ${isToday && !isSelected ? 'text-green-700' : ''}`}>
                  {date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => onSelect(addDays(weekStart, 7))}
          aria-label="Nächste Woche"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ›
        </button>
      </div>
    </div>
  )
}
