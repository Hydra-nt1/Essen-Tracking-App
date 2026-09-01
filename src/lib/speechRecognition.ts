export interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

export interface MinimalSpeechRecognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

export function createSpeechRecognition(): MinimalSpeechRecognition | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}
