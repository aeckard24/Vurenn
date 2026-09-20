import type { EntitlementKey, PlanId } from '@/lib/types'
import { hasEntitlement } from './plans'

export type FeatureKey =
  | 'chat'
  | 'webSearch'
  | 'deepResearch'
  | 'fileUploads'
  | 'imageGeneration'
  | 'dataAnalysis'
  | 'voice'
  | 'projects'
  | 'library'
  | 'memory'
  | 'scheduledTasks'
  | 'assistants'
  | 'plugins'
  | 'connectors'
  | 'workspace'

const FEATURE_ENTITLEMENTS: Record<FeatureKey, EntitlementKey | null> = {
  chat: null,
  webSearch: 'webSearch',
  deepResearch: 'deepResearch',
  fileUploads: 'fileUploads',
  imageGeneration: 'imageGeneration',
  dataAnalysis: 'dataAnalysis',
  voice: 'voice',
  projects: 'projects',
  library: 'library',
  memory: 'savedMemory',
  scheduledTasks: 'scheduledTasks',
  assistants: 'customAssistants',
  plugins: 'plugins',
  connectors: 'connectors',
  workspace: 'workspace',
}

export function canUseFeature(planId: PlanId, feature: FeatureKey): boolean {
  const entitlement = FEATURE_ENTITLEMENTS[feature]
  return entitlement === null || hasEntitlement(planId, entitlement)
}

export function getFeatureEntitlement(
  feature: FeatureKey,
): EntitlementKey | null {
  return FEATURE_ENTITLEMENTS[feature]
}
