let fallbackCounter = 0

export function createClientId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${(fallbackCounter++).toString(36)}`
  return `${prefix}_${uuid}`
}
