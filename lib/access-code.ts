import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export const PENDING_BETA_ACCESS_CODE_KEY = 'vurenn-private-beta-access-code'

export function savePendingBetaAccessCode(code: string): void {
  window.localStorage.setItem(PENDING_BETA_ACCESS_CODE_KEY, code.trim().toUpperCase())
}

export function getPendingBetaAccessCode(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(PENDING_BETA_ACCESS_CODE_KEY)
}

export function clearPendingBetaAccessCode(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PENDING_BETA_ACCESS_CODE_KEY)
}

export async function validateBetaAccessCode(code: string): Promise<boolean> {
  const response = await apiClient.request<{ valid: true }>(API_ENDPOINTS.accessCodeValidate, {
    method: 'POST',
    authenticated: false,
    body: { code },
  })
  return response.valid
}

export async function redeemPendingBetaAccessCode(): Promise<boolean> {
  const code = getPendingBetaAccessCode()
  if (!code) return false
  await apiClient.request(API_ENDPOINTS.accessCodeRedeem, {
    method: 'POST',
    body: { code },
  })
  clearPendingBetaAccessCode()
  return true
}
