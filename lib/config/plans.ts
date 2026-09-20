import type {
  BillingInterval,
  EntitlementKey,
  LimitKey,
  LimitValue,
  Plan,
  PlanId,
} from '@/lib/types'

/**
 * SINGLE SOURCE OF TRUTH for Vurenn subscription tiers.
 *
 * Prices are defined once as constants so they can be changed later without
 * touching any component. Effective monthly price and annual savings are
 * always calculated from these values, never hardcoded.
 */

export const PLAN_PRICING = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 9.99, annual: 99 },
  premier: { monthly: 19.99, annual: 199 },
} as const

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with Vurenn',
    description:
      'A credible entry plan for trying Vurenn and completing everyday tasks.',
    price: PLAN_PRICING.free,
    ctaLabel: 'Start free',
    highlights: [
      'Access to Vurenn Fast',
      'Limited access to Vurenn',
      'Standard chat history & search',
      'Basic file attachments',
      'Dark and light themes',
    ],
    entitlements: {
      useVurennFast: true,
      useVurenn: true,
      fileUploads: true,
      webSearch: true,
      imageGeneration: true,
      dataAnalysis: true,
      savedMemory: true,
      projects: true,
      library: true,
      advancedAppearance: false,
      customAssistants: false,
      scheduledTasks: false,
      plugins: false,
      connectors: false,
      workspace: false,
    },
    limits: {
      messages: 'backendDefined',
      advancedMessages: 'backendDefined',
      researchRequests: null,
      deepResearchRequests: null,
      fileUploads: 'backendDefined',
      filesPerConversation: 'backendDefined',
      maximumFileSize: 'backendDefined',
      imageGenerations: 'backendDefined',
      projects: 3,
      savedMemories: 'backendDefined',
      scheduledTasks: null,
      assistants: null,
      libraryStorage: 'backendDefined',
      voiceMinutes: 'backendDefined',
      connectorActions: null,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Best value for most people',
    description:
      'The mainstream paid plan with higher limits and expanded tools for everyday work.',
    price: PLAN_PRICING.pro,
    badge: 'Best value',
    highlight: true,
    featured: true,
    ctaLabel: 'Upgrade to Pro',
    highlights: [
      'Everything in Free',
      'Substantially higher Vurenn usage',
      'Limited Vurenn Research access',
      'Advanced web search & data analysis',
      'Scheduled tasks, assistants & connectors',
      'Workspace, branching & priority processing',
    ],
    entitlements: {
      useVurennFast: true,
      useVurenn: true,
      useVurennResearch: true,
      webSearch: true,
      deepResearch: true,
      fileUploads: true,
      expandedFileUploads: true,
      dataAnalysis: true,
      imageGeneration: true,
      voice: true,
      savedMemory: true,
      crossConversationMemory: true,
      projectMemory: true,
      projects: true,
      expandedProjects: true,
      library: true,
      expandedStorage: true,
      scheduledTasks: true,
      customAssistants: true,
      plugins: true,
      connectors: true,
      workspace: true,
      advancedExports: true,
      advancedAppearance: true,
      fontSelection: true,
      priorityProcessing: true,
      earlyAccess: true,
      // Premier-only capabilities remain false on Pro:
      useVurennMax: false,
      useVurennApex: false,
      advancedScheduledTasks: false,
      expandedAssistants: false,
      workspaceHistory: false,
      prioritySupport: false,
      advancedAgents: false,
    },
    limits: {
      messages: 'veryHigh',
      advancedMessages: 'backendDefined',
      researchRequests: 'backendDefined',
      deepResearchRequests: 'backendDefined',
      fileUploads: 'backendDefined',
      filesPerConversation: 'backendDefined',
      maximumFileSize: 'backendDefined',
      imageGenerations: 'backendDefined',
      projects: 50,
      projectFiles: 'backendDefined',
      savedMemories: 'backendDefined',
      scheduledTasks: 'backendDefined',
      taskFrequency: 'backendDefined',
      assistants: 'backendDefined',
      assistantFiles: 'backendDefined',
      libraryStorage: 'backendDefined',
      voiceMinutes: 'backendDefined',
      connectorActions: 'backendDefined',
    },
  },
  premier: {
    id: 'premier',
    name: 'Premier',
    tagline: 'Vurenn’s highest individual access',
    description:
      'For power users, researchers, developers, and creators who rely on Vurenn throughout the day.',
    price: PLAN_PRICING.premier,
    badge: 'Highest access',
    ctaLabel: 'Upgrade to Premier',
    highlights: [
      'Everything in Pro',
      'Access to Vurenn Apex, the strongest model',
      'Very high usage across every feature',
      'Highest research & deep-research limits',
      'Advanced automation & workspace history',
      'Priority access & priority support',
    ],
    entitlements: {
      useVurennFast: true,
      useVurenn: true,
      useVurennMax: true,
      useVurennResearch: true,
      useVurennApex: true,
      webSearch: true,
      deepResearch: true,
      fileUploads: true,
      expandedFileUploads: true,
      dataAnalysis: true,
      imageGeneration: true,
      voice: true,
      savedMemory: true,
      crossConversationMemory: true,
      projectMemory: true,
      projects: true,
      expandedProjects: true,
      library: true,
      expandedStorage: true,
      scheduledTasks: true,
      advancedScheduledTasks: true,
      customAssistants: true,
      expandedAssistants: true,
      plugins: true,
      connectors: true,
      workspace: true,
      workspaceHistory: true,
      advancedExports: true,
      advancedAppearance: true,
      fontSelection: true,
      priorityProcessing: true,
      earlyAccess: true,
      prioritySupport: true,
      advancedAgents: true,
    },
    limits: {
      messages: 'veryHigh',
      advancedMessages: 'veryHigh',
      researchRequests: 'veryHigh',
      deepResearchRequests: 'veryHigh',
      fileUploads: 'veryHigh',
      filesPerConversation: 'veryHigh',
      maximumFileSize: 'backendDefined',
      imageGenerations: 'veryHigh',
      projects: 'veryHigh',
      projectFiles: 'veryHigh',
      savedMemories: 'veryHigh',
      scheduledTasks: 'veryHigh',
      taskFrequency: 'backendDefined',
      assistants: 'veryHigh',
      assistantFiles: 'veryHigh',
      libraryStorage: 'veryHigh',
      voiceMinutes: 'veryHigh',
      connectorActions: 'veryHigh',
    },
  },
}

/** Ordered for display: Free → Pro → Premier. */
export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'premier']
export const PLAN_LIST: Plan[] = PLAN_ORDER.map((id) => PLANS[id])

/** Numeric rank so we can compare "is plan A at least plan B". */
const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, premier: 2 }

export const PREMIER_FAIR_USE =
  'Premier provides Vurenn’s highest individual access levels. Fair-use, safety, capacity, and abuse-prevention safeguards may apply.'

export const BILLING_NOT_CONNECTED_MESSAGE =
  'Billing integration is not connected yet.'

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId]
}

export function planAtLeast(planId: PlanId, minimum: PlanId): boolean {
  return PLAN_RANK[planId] >= PLAN_RANK[minimum]
}

export function hasEntitlement(
  planId: PlanId,
  entitlement: EntitlementKey,
): boolean {
  return PLANS[planId].entitlements[entitlement] === true
}

export function getPlanLimit(planId: PlanId, limitKey: LimitKey): LimitValue {
  const value = PLANS[planId].limits[limitKey]
  return value === undefined ? null : value
}

/**
 * The lowest plan that grants an entitlement, or null if no plan does.
 */
export function getRequiredPlanForEntitlement(
  entitlement: EntitlementKey,
): PlanId | null {
  for (const id of PLAN_ORDER) {
    if (hasEntitlement(id, entitlement)) return id
  }
  return null
}

/**
 * Given the user's current plan and an entitlement they lack, return the plan
 * they should upgrade to (or null if already entitled / unavailable anywhere).
 */
export function getUpgradeTarget(
  currentPlanId: PlanId,
  entitlement: EntitlementKey,
): PlanId | null {
  if (hasEntitlement(currentPlanId, entitlement)) return null
  const required = getRequiredPlanForEntitlement(entitlement)
  if (!required) return null
  return planAtLeast(currentPlanId, required) ? null : required
}

export function calculateEffectiveMonthlyPrice(annualPrice: number): number {
  return annualPrice / 12
}

/**
 * Annual savings as a percentage, calculated from configured prices.
 * Returns 0 when either price is 0 to avoid dividing by zero.
 */
export function calculateAnnualSavings(planId: PlanId): number {
  const { monthly, annual } = PLANS[planId].price
  if (monthly <= 0 || annual <= 0) return 0
  const fullYear = monthly * 12
  return Math.round(((fullYear - annual) / fullYear) * 100)
}

/** Amount saved per year, in currency units. */
export function calculateAnnualSavingsAmount(planId: PlanId): number {
  const { monthly, annual } = PLANS[planId].price
  if (monthly <= 0 || annual <= 0) return 0
  return monthly * 12 - annual
}

export function formatPrice(amount: number): string {
  if (amount === 0) return '$0'
  const rounded = Math.round(amount * 100) / 100
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`
}

export function getDisplayPrice(
  planId: PlanId,
  interval: BillingInterval,
): { amount: number; label: string; suffix: string } {
  const { monthly, annual } = PLANS[planId].price
  if (interval === 'annual') {
    const effective = calculateEffectiveMonthlyPrice(annual)
    return {
      amount: effective,
      label: formatPrice(effective),
      suffix: 'per month, billed annually',
    }
  }
  return { amount: monthly, label: formatPrice(monthly), suffix: 'per month' }
}
