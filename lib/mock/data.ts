import type { Conversation, Message, User } from '@/lib/types'

export const MOCK_USER: User = {
  id: 'user_demo',
  displayName: 'Vurenn Demo',
  email: 'demo@example.invalid',
  avatarUrl: null,
  plan: 'pro',
}

/**
 * No seed conversations — the app starts with an empty history.
 * When a real backend is connected, this data will come from the API.
 */
export const MOCK_CONVERSATIONS: Conversation[] = []

export const MOCK_MESSAGES: Record<string, Message[]> = {}
