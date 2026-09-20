export const VOICE_PREFERENCE_STORAGE_KEY = 'vurenn-voice-id'

export const VOICE_OPTIONS = [
  {
    id: 'af_heart',
    name: 'Heart',
    description: 'Warm, clear, and conversational',
    tone: 'Warm',
  },
  {
    id: 'af_bella',
    name: 'Bella',
    description: 'Calm, polished, and expressive',
    tone: 'Calm',
  },
  {
    id: 'af_nicole',
    name: 'Nicole',
    description: 'Direct, confident, and natural',
    tone: 'Clear',
  },
  {
    id: 'am_michael',
    name: 'Michael',
    description: 'Grounded, relaxed, and steady',
    tone: 'Steady',
  },
  {
    id: 'am_liam',
    name: 'Liam',
    description: 'Friendly, modern, and energetic',
    tone: 'Bright',
  },
] as const

export type VurennVoiceId = (typeof VOICE_OPTIONS)[number]['id']

export const DEFAULT_VOICE_ID: VurennVoiceId = 'af_heart'

export function isVurennVoiceId(value: unknown): value is VurennVoiceId {
  return VOICE_OPTIONS.some((voice) => voice.id === value)
}

export function getStoredVoiceId(): VurennVoiceId {
  if (typeof window === 'undefined') return DEFAULT_VOICE_ID
  const value = window.localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY)
  return isVurennVoiceId(value) ? value : DEFAULT_VOICE_ID
}

export function storeVoiceId(value: VurennVoiceId): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, value)
}
