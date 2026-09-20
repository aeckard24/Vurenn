import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export const PENDING_BETA_INVITE_KEY = 'vurenn-private-beta-invite'

export interface BetaInvitePreview {
  valid: true
  label: string
  expires_at: string
  remaining_uses: number
  email_required: boolean
  email_hint: string
}

export function savePendingBetaInvite(token: string): void {
  window.localStorage.setItem(PENDING_BETA_INVITE_KEY, token)
}

export function getPendingBetaInvite(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(PENDING_BETA_INVITE_KEY)
}

export function clearPendingBetaInvite(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PENDING_BETA_INVITE_KEY)
}

export async function validateBetaInvite(token: string): Promise<BetaInvitePreview> {
  return apiClient.request<BetaInvitePreview>(API_ENDPOINTS.inviteValidate, {
    method: 'POST',
    body: { token },
    authenticated: false,
  })
}

export async function hashBetaInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function redeemPendingBetaInvite(): Promise<boolean> {
  const token = getPendingBetaInvite()
  if (!token) return false
  await apiClient.request(API_ENDPOINTS.inviteRedeem, {
    method: 'POST',
    body: { token },
  })
  window.localStorage.removeItem(PENDING_BETA_INVITE_KEY)
  return true
}
