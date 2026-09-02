import { useState, type FormEvent } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabaseClient'
import type { MealType } from '../../types/database'

interface ChatItem {
  name: string
  quantity_g: number
  meal_type: MealType
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  items?: ChatItem[]
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snacks',
}

interface AiChatProps {
  onPickItem: (item: ChatItem) => void
}

export function AiChat({ onPickItem }: AiChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('Chat', {
        body: { message: text },
      })
      if (invokeError) throw invokeError

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply as string, items: (data.items as ChatItem[]) ?? [] },
      ])
    } catch (err) {
      let detail = err instanceof Error ? err.message : String(err)
      const context = (err as { context?: Response }).context
      if (context && typeof context.json === 'function') {
        try {
          const body = await context.clone().json()
          detail = JSON.stringify(body)
        } catch {
          try {
            detail = await context.clone().text()
          } catch {
            // keep the generic message
          }
        }
      }
      setError(`Der Assistent ist gerade nicht erreichbar. (${detail})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      {messages.length === 0 && (
        <p className="mb-3 text-sm text-gray-400">
          Schreib z.B. "2 Eier und ein Toast zum Frühstück" oder stell eine Frage zu Ernährung.
        </p>
      )}

      {messages.length > 0 && (
        <div className="mb-3 max-h-[28rem] space-y-3 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <div
                className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
              {msg.items && msg.items.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm"
                    >
                      <span>
                        <span className="font-medium text-gray-900">{item.name}</span>{' '}
                        <span className="text-gray-500">
                          · {item.quantity_g}g · {mealLabels[item.meal_type]}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onPickItem(item)}
                        className="shrink-0 rounded-full border border-green-500 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        + Hinzufügen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Was hast du gegessen?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'Senden'}
        </Button>
      </form>
    </Card>
  )
}
