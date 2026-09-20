import { BACKEND_UNAVAILABLE_RESPONSE } from '@/lib/config/flags'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/**
 * Safe, public wording used by the application shell. Plans, models, and
 * entitlements intentionally live in their dedicated configuration modules so
 * the client does not ship duplicate registries.
 */
export interface PublicContent {
  accuracyDisclaimer: string
  backendUnavailableMessage: string
  welcomeHeading: string
  tagline: string
  maintenanceMessage: string
}

export interface PublicConfig {
  content: PublicContent
  maintenanceMode: boolean
  fetchedAt: string
}

const DEFAULT_CONFIG: PublicConfig = {
  content: {
    accuracyDisclaimer:
      'Vurenn can make mistakes. Please verify important information.',
    backendUnavailableMessage: BACKEND_UNAVAILABLE_RESPONSE,
    welcomeHeading: 'What do you want to know?',
    tagline: 'Clarity over confidence. Always.',
    maintenanceMessage:
      "Vurenn is temporarily offline for scheduled maintenance. We'll be back shortly.",
  },
  maintenanceMode: false,
  fetchedAt: new Date().toISOString(),
}

let cachedConfig: PublicConfig | null = null

/**
 * Returns lightweight local public content. Add a focused service adapter when
 * a public configuration endpoint is agreed with the backend.
 */
export async function fetchPublicConfig(): Promise<PublicConfig> {
  try {
    const remote = await apiClient.request<Partial<PublicConfig>>(
      API_ENDPOINTS.publicConfig,
      { authenticated: false },
    )
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...remote,
      content: { ...DEFAULT_CONFIG.content, ...(remote.content ?? {}) },
      fetchedAt: remote.fetchedAt ?? new Date().toISOString(),
    }
  } catch {
    cachedConfig = { ...DEFAULT_CONFIG, fetchedAt: new Date().toISOString() }
  }
  return cachedConfig
}

export function getPublicConfigSync(): PublicConfig {
  return cachedConfig ?? DEFAULT_CONFIG
}
