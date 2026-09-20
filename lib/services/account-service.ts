import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { PlanId } from '@/lib/types'
import type { AppearancePreferences } from '@/lib/appearance'

export interface CreditAccount {
  balance: number
  lifetime_granted: number
  lifetime_spent: number
  updated_at: string
  plan_id: PlanId
  metered: boolean
  unlimited: boolean
  basic_usage: BasicUsageLimit | null
}

export interface BasicUsageLimit {
  limit: number
  used: number
  remaining: number
  window_hours: number
  exhausted: boolean
  reset_at: string | null
}

export interface TeamMode {
  eligible: boolean
  admin: boolean
  developer: boolean
  can_manage_invites: boolean
  limited_mode: boolean
  unlimited: boolean
  effective_plan: PlanId
}

export interface UsageCost {
  id: string
  label: string
  credits: number
  description: string
  available: boolean
}

export interface VurennProfile {
  display_name: string
  occupation: string
  goals: string[]
  response_style: 'concise' | 'balanced' | 'detailed'
  onboarding_completed: boolean
  onboarding_skipped: boolean
  security_prompt_dismissed: boolean
  camera_unlock_enabled: boolean
  legal_version: string | null
  legal_accepted_at: string | null
  response_preferences: ResponsePreferences
}

export interface ResponsePreferences {
  format: 'balanced' | 'concise' | 'detailed' | 'bullets' | 'step_by_step'
  formality: number
  warmth: number
  humor: number
  creativity: number
  verbosity: number
  initiative: number
  markdown: boolean
  emojis: boolean
  custom_instructions: string
  voice_id?: string
  appearance?: AppearancePreferences
}

export interface VurennApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  created_at: string
}

export const accountService = {
  getCredits() {
    return apiClient.request<CreditAccount>(API_ENDPOINTS.credits)
  },
  getUsageCosts() {
    return apiClient.request<{
      currency: string
      costs: UsageCost[]
      note: string
    }>(API_ENDPOINTS.usageCosts)
  },
  getTeamMode() {
    return apiClient.request<TeamMode>(API_ENDPOINTS.teamMode)
  },
  setTeamMode(limitedMode: boolean) {
    return apiClient.request<TeamMode>(API_ENDPOINTS.teamMode, {
      method: 'PUT',
      body: { limited_mode: limitedMode },
    })
  },
  getProfile() {
    return apiClient.request<VurennProfile>(API_ENDPOINTS.profile)
  },
  updateProfile(values: Partial<VurennProfile>) {
    return apiClient.request<VurennProfile>(API_ENDPOINTS.profile, {
      method: 'PATCH',
      body: values,
    })
  },
  recordLegalConsent(value: { policy_version: string; accepted_at: string; age_confirmed: boolean; acceptance_method?: 'oauth_signup' | 'policy_update' }) {
    return apiClient.request<{ accepted: boolean; policy_version: string; accepted_at: string }>(API_ENDPOINTS.legalConsent, {
      method: 'POST',
      body: {
        ...value,
        terms_accepted: true,
        privacy_accepted: true,
        acceptable_use_accepted: true,
      },
    })
  },
  listApiKeys() {
    return apiClient.request<{ keys: VurennApiKey[] }>(API_ENDPOINTS.apiKeys)
  },
  createApiKey(name: string) {
    return apiClient.request<{
      key: string
      record: VurennApiKey
      warning: string
    }>(API_ENDPOINTS.apiKeys, {
      method: 'POST',
      body: { name },
    })
  },
  revokeApiKey(keyId: string) {
    return apiClient.request<void>(API_ENDPOINTS.apiKey(keyId), {
      method: 'DELETE',
    })
  },
}
