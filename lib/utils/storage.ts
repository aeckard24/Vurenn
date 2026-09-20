/** Small, SSR-safe localStorage wrapper. */
export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
      const raw = window.localStorage.getItem(key)
      if (raw == null) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota / private mode — ignore for mock persistence */
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

export const STORAGE_KEYS = {
  conversations: 'vurenn-conversations',
  messages: 'vurenn-messages',
  theme: 'vurenn-theme',
  model: 'vurenn-model',
  settings: 'vurenn-settings',
  optimisticConversations: 'vurenn-optimistic-conversations',
  dataVersion: 'vurenn-data-version',
  pending: (id: string) => `vurenn-pending-${id}`,
} as const

/**
 * Bump this string whenever the seed data shape changes significantly so that
 * existing users get a clean slate on next load (conversations, messages).
 */
const CURRENT_DATA_VERSION = '2'

/**
 * Call once at app startup (client-side only). If the stored version does not
 * match CURRENT_DATA_VERSION, wipe conversation and message caches so stale
 * mock seed data does not persist across schema changes.
 */
export function flushStaleData(): void {
  if (typeof window === 'undefined') return
  const stored = storage.get<string | null>(STORAGE_KEYS.dataVersion, null)
  if (stored !== CURRENT_DATA_VERSION) {
    storage.remove(STORAGE_KEYS.conversations)
    storage.remove(STORAGE_KEYS.messages)
    storage.set(STORAGE_KEYS.dataVersion, CURRENT_DATA_VERSION)
  }
}
