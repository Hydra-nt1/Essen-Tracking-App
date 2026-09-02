import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { FoodPicker } from '../../components/FoodPicker'
import { AiChat } from '../dashboard/AiChat'
import { todayKey } from '../../lib/date'
import { round1 } from '../../lib/nutrition'
import { useAddDiaryEntry } from '../diary/useDiary'
import type { MealType } from '../../types/database'

const mealLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snacks',
}

export function ChatPage() {
  const addEntry = useAddDiaryEntry()
  const [pending, setPending] = useState<{ mealType: MealType; name: string; quantityG: number } | null>(null)

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
        <span>💬</span> KI-Chat
      </h1>

      <AiChat
        onPickItem={(item) =>
          setPending({ mealType: item.meal_type, name: item.name, quantityG: item.quantity_g })
        }
      />

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `${mealLabels[pending.mealType]} – Lebensmittel hinzufügen` : ''}
      >
        {pending && (
          <FoodPicker
            mealType={pending.mealType}
            initialSearch={pending.name}
            initialQuantity={pending.quantityG}
            onSelect={async (food, quantityG) => {
              await addEntry.mutateAsync({
                food_id: food.id,
                date: todayKey(),
                meal_type: pending.mealType,
                quantity_g: round1(quantityG),
              })
              setPending(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
