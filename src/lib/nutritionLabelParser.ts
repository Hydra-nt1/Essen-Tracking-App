export interface ParsedNutrition {
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}

function findValue(text: string, keyword: RegExp, exclude?: RegExp): number | undefined {
  const re = new RegExp(keyword.source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    if (exclude) {
      const before = text.slice(Math.max(0, match.index - 25), match.index)
      if (exclude.test(before)) continue
    }
    const value = parseFloat(match[1].replace(',', '.'))
    if (!Number.isNaN(value)) return value
    // Zero-width or invalid match: avoid an infinite loop on empty captures.
    if (match.index === re.lastIndex) re.lastIndex++
  }
  return undefined
}

export function parseNutritionLabel(rawText: string): ParsedNutrition {
  const text = rawText.replace(/\s+/g, ' ')
  return {
    calories: findValue(text, /(\d+[.,]?\d*)\s*kcal/i),
    protein: findValue(text, /(?:eiwei[ßs]s?|protein)\D{0,15}(\d+[.,]?\d*)\s*g/i),
    fat: findValue(text, /fett\D{0,15}(\d+[.,]?\d*)\s*g/i, /gesättigt/i),
    carbs: findValue(text, /kohlenhydrate\D{0,15}(\d+[.,]?\d*)\s*g/i),
  }
}
