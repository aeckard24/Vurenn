import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { PlanId } from '@/lib/types'

export interface LiveAdminConfig {
  plans: Array<{ id: PlanId; name: string; monthly_cents: number; annual_cents: number; status: 'active' | 'misconfigured' }>
  models: Array<{ id: string; name: string; required_plan: PlanId; status: 'available' | 'unavailable'; minimum_credits: number }>
  features: Array<{ id: string; name: string; description: string; available: boolean; minimum_credits: number }>
  connections: { authentication: boolean; database: boolean; assistant: boolean; billing: boolean }
  fetched_at: string
}

export const liveAdminService = {
  getConfig() {
    return apiClient.request<LiveAdminConfig>(API_ENDPOINTS.adminConfig)
  },
}
