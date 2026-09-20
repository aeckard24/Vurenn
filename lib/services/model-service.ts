import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { BackendModelStatus, ModelsResponse } from '@/lib/api/types'
import { planAtLeast } from '@/lib/config/plans'
import type { Model, ModelStatus, PlanId } from '@/lib/types'

export interface ModelService {
  list(): Promise<Model[]>
  canAccess(planId: PlanId, model: Model): boolean
}

export function canAccessConfiguredModel(
  planId: PlanId,
  model: Model,
): boolean {
  return model.status === 'available' && planAtLeast(planId, model.minPlan)
}

function modelStatus(status: BackendModelStatus): ModelStatus {
  return status === 'coming_soon' ? 'comingSoon' : status
}

export function createHttpModelService(): ModelService {
  return {
    async list() {
      const response = await apiClient.request<ModelsResponse>(
        API_ENDPOINTS.models,
        { authenticated: false },
      )
      return response.models.map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        status: modelStatus(model.status),
        minPlan: model.required_plan,
      }))
    },
    canAccess: canAccessConfiguredModel,
  }
}
