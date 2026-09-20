import type { User } from '@/lib/types'
import { MOCK_USER } from '@/lib/mock/data'

export const SESSION_PENDING_USER: User = {
  id: 'session-pending',
  displayName: '',
  email: '',
  avatarUrl: null,
  plan: 'free',
}

export function initialUserForMode(mode: 'mock' | 'backend'): User {
  return mode === 'mock' ? MOCK_USER : SESSION_PENDING_USER
}
