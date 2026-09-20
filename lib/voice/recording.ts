const PREFERRED_AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/webm',
  'audio/ogg;codecs=opus',
] as const

export function selectRecorderMimeType(
  isSupported: (mimeType: string) => boolean,
): string | undefined {
  return PREFERRED_AUDIO_TYPES.find(isSupported)
}

export function voiceFileMetadata(mimeType: string | undefined): {
  mimeType: string
  filename: string
} {
  const normalized = (mimeType || 'audio/webm').split(';', 1)[0].toLowerCase()
  if (normalized === 'audio/mp4' || normalized === 'video/mp4') {
    return { mimeType: 'audio/mp4', filename: 'vurenn-voice.m4a' }
  }
  if (normalized === 'audio/ogg') {
    return { mimeType: 'audio/ogg', filename: 'vurenn-voice.ogg' }
  }
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav') {
    return { mimeType: 'audio/wav', filename: 'vurenn-voice.wav' }
  }
  if (normalized === 'audio/mpeg' || normalized === 'audio/mp3') {
    return { mimeType: 'audio/mpeg', filename: 'vurenn-voice.mp3' }
  }
  return { mimeType: 'audio/webm', filename: 'vurenn-voice.webm' }
}
