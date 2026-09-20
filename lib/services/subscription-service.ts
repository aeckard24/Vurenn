import {
  getPlan,
  getPlanLimit,
  getUpgradeTarget,
  hasEntitlement,
} from '@/lib/config/plans'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  BillingInterval,
  EntitlementKey,
  LimitKey,
  LimitValue,
  Plan,
  PlanId,
} from '@/lib/types'

export interface Subscription {
  planId: PlanId
  status: 'inactive' | 'active' | 'past_due' | 'canceled'
  currentPeriodEnd: string | null
}

export interface SubscriptionService {
  getPlan(planId: PlanId): Plan
  hasEntitlement(planId: PlanId, key: EntitlementKey): boolean
  getLimit(planId: PlanId, key: LimitKey): LimitValue
  getUpgradeTarget(planId: PlanId, key: EntitlementKey): PlanId | null
  getCurrent(): Promise<Subscription>
  createCheckout(planId: PlanId, interval: BillingInterval): Promise<string>
  createCreditCheckout(packId: 'credits_50' | 'credits_100'): Promise<string>
  createStoreCheckout(itemId: string): Promise<string>
}

export const subscriptionService: SubscriptionService = {
  getPlan,
  hasEntitlement,
  getLimit: getPlanLimit,
  getUpgradeTarget,
  async getCurrent() {
    const response = await apiClient.request<{
      plan_id: PlanId
      status: Subscription['status']
      current_period_end: string | null
    }>(API_ENDPOINTS.subscription)
    return {
      planId: response.plan_id,
      status: response.status,
      currentPeriodEnd: response.current_period_end,
    }
  },
  async createCheckout(planId, interval) {
    const response = await apiClient.request<{ url: string }>(
      API_ENDPOINTS.billingCheckout,
      {
        method: 'POST',
        body: { plan_id: planId, interval },
      },
    )
    return response.url
  },
  async createCreditCheckout(packId) {
    const response = await apiClient.request<{ url: string }>(
      API_ENDPOINTS.billingCheckout,
      {
        method: 'POST',
        body: { pack_id: packId },
      },
    )
    return response.url
  },
  async createStoreCheckout(itemId) {
    const response = await apiClient.request<{ url: string }>(API_ENDPOINTS.billingCheckout, {
      method: 'POST',
      body: { item_id: itemId },
    })
    return response.url
  },
}
