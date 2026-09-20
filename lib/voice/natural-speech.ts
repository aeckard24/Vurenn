import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import {
  getStoredVoiceId,
  type VurennVoiceId,
} from '@/lib/voice/voice-options'

const NATURAL_VOICE_HINTS = [
  'natural',
  'neural',
  'microsoft ava',
  'microsoft aria',
  'microsoft jenny',
  'microsoft emma',
  'microsoft andrew',
  'microsoft guy',
  'microsoft ryan',
  'microsoft sonia',
  'google us english',
  'google uk english',
  'samantha',
  'alex',
  'daniel',
  'karen',
  'moira',
]

let speechGeneration = 0
let activeUtterances: SpeechSynthesisUtterance[] = []
let activeAudio: HTMLAudioElement | null = null
let activeAudioUrl: string | null = null

export interface SpeechPlaybackOptions {
  onStart?: () => void
  onEnd?: () => void
  voiceId?: VurennVoiceId
}

function releaseActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.removeAttribute('src')
    activeAudio.load()
  }
  if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl)
  activeAudio = null
  activeAudioUrl = null
}

export function cleanSpeechText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code example omitted from spoken reply. ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[*_~`>|]/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[\uFE0E\uFE0F\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function voiceScore(
  voice: Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'default' | 'localService'>,
  preferredLanguage: string,
): number {
  const name = voice.name.toLowerCase()
  const language = voice.lang.toLowerCase()
  const preferred = preferredLanguage.toLowerCase()
  const preferredBase = preferred.split('-')[0]
  let score = 0

  if (language === preferred) score += 80
  else if (language.split('-')[0] === preferredBase) score += 50
  else if (language.startsWith('en')) score += 15

  NATURAL_VOICE_HINTS.forEach((hint, index) => {
    if (name.includes(hint)) score += 120 - index
  })
  if (voice.default) score += 8
  // Online browser voices are often the higher-quality neural choices, so do
  // not penalize non-local voices. Local voices still get a small reliability bonus.
  if (voice.localService) score += 3
  if (/compact|espeak|festival/i.test(name)) score -= 80
  return score
}

export function selectNaturalVoice(
  voices: SpeechSynthesisVoice[],
  preferredLanguage: string,
): SpeechSynthesisVoice | undefined {
  return [...voices].sort(
    (left, right) =>
      voiceScore(right, preferredLanguage) -
      voiceScore(left, preferredLanguage),
  )[0]
}

function phraseChunks(text: string, maximumLength = 280): string[] {
  const sentences = text.match(/[^.!?;:]+[.!?;:]?["')\]]?/g) ?? [text]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const value = sentence.trim()
    if (!value) continue
    if (current && current.length + value.length + 1 > maximumLength) {
      chunks.push(current)
      current = value
    } else {
      current = current ? `${current} ${value}` : value
    }
  }
  if (current) chunks.push(current)
  return chunks
}

async function loadVoices(
  synthesis: SpeechSynthesis,
): Promise<SpeechSynthesisVoice[]> {
  const immediate = synthesis.getVoices()
  if (immediate.length > 0) return immediate

  return new Promise((resolve) => {
    let timeoutId = 0
    const finish = () => {
      window.clearTimeout(timeoutId)
      synthesis.removeEventListener('voiceschanged', finish)
      resolve(synthesis.getVoices())
    }
    synthesis.addEventListener('voiceschanged', finish, { once: true })
    timeoutId = window.setTimeout(finish, 800)
  })
}

export function stopNaturalSpeech(): void {
  speechGeneration += 1
  activeUtterances = []
  if (typeof window !== 'undefined') releaseActiveAudio()
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export async function speakVurennReply(
  messageId: string,
  fallbackText: string,
  options: SpeechPlaybackOptions = {},
): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    typeof Audio === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return speakNaturally(fallbackText, undefined, options)
  }

  stopNaturalSpeech()
  const generation = speechGeneration
  const voiceId = options.voiceId ?? getStoredVoiceId()
  try {
    const response = await apiClient.fetchResponse(
      API_ENDPOINTS.voiceSynthesize,
      {
        method: 'POST',
        body: { message_id: messageId, voice_id: voiceId },
        headers: {
          accept: 'audio/wav',
          'X-Idempotency-Key': typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${messageId}-${Date.now()}`,
        },
        timeoutMs: 12_000,
      },
    )
    if (generation !== speechGeneration) return false
    const audioBlob = await response.blob()
    if (generation !== speechGeneration) return false

    activeAudioUrl = URL.createObjectURL(audioBlob)
    activeAudio = new Audio(activeAudioUrl)
    activeAudio.preload = 'auto'
    activeAudio.onplay = options.onStart
      ? () => options.onStart?.()
      : null
    activeAudio.onended = () => {
      releaseActiveAudio()
      options.onEnd?.()
    }
    activeAudio.onerror = () => {
      releaseActiveAudio()
      options.onEnd?.()
    }
    await activeAudio.play()
    return true
  } catch {
    if (generation !== speechGeneration) return false
    releaseActiveAudio()
    return speakNaturally(fallbackText, undefined, options)
  }
}

export async function speakNaturally(
  rawText: string,
  language = typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  options: SpeechPlaybackOptions = {},
): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    !('SpeechSynthesisUtterance' in window)
  ) {
    return false
  }

  const text = cleanSpeechText(rawText)
  if (!text) {
    options.onEnd?.()
    return false
  }

  stopNaturalSpeech()
  const generation = speechGeneration
  const synthesis = window.speechSynthesis
  const voices = await loadVoices(synthesis)
  if (generation !== speechGeneration) return false
  const voice = selectNaturalVoice(voices, language)

  activeUtterances = phraseChunks(text).map((phrase, index, chunks) => {
    const utterance = new SpeechSynthesisUtterance(phrase)
    utterance.voice = voice ?? null
    utterance.lang = voice?.lang || language || 'en-US'
    utterance.rate = phrase.length < 45 ? 0.94 : 0.97
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => {
      if (index === chunks.length - 1 && generation === speechGeneration) {
        activeUtterances = []
        options.onEnd?.()
      }
    }
    utterance.onerror = () => {
      if (generation === speechGeneration) {
        activeUtterances = []
        options.onEnd?.()
      }
    }
    return utterance
  })

  options.onStart?.()
  for (const utterance of activeUtterances) synthesis.speak(utterance)
  return true
}
