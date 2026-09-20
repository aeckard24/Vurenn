import type { Model } from '@/lib/types'
import { APEX_UNAVAILABLE_MESSAGE, FLAGS } from '@/lib/config/flags'

/**
 * SINGLE SOURCE OF TRUTH for Vurenn models.
 *
 * Note the deliberate separation:
 * - "Vurenn Premier" is a SUBSCRIPTION (see plans.ts).
 * - "Vurenn Apex" is the strongest MODEL (defined here).
 * These names are never used interchangeably.
 */

export const MODELS: Model[] = [
  {
    id: 'vurenn-fast',
    name: 'Vurenn Fast',
    description: 'Fast, efficient responses for routine questions and lightweight tasks.',
    status: 'available',
    minPlan: 'free',
    availabilityNote: {
      free: 'Included',
      pro: 'Higher limits',
      premier: 'Very high limits',
    },
  },
  {
    id: 'vurenn',
    name: 'Vurenn',
    description: 'Balanced intelligence for everyday reasoning, writing, learning, and planning.',
    status: 'available',
    minPlan: 'free',
    availabilityNote: {
      free: 'Limited',
      pro: 'Higher limits',
      premier: 'Very high limits',
    },
  },
  {
    id: 'vurenn-axiom',
    name: 'Vurenn Axiom',
    description: 'Higher-performance reasoning for complex math, science, code, and careful problem solving.',
    status: 'available',
    minPlan: 'pro',
    badge: 'Pro',
    availabilityNote: {
      free: 'Upgrade to use',
      pro: 'Included',
      premier: 'Higher limits',
    },
  },
  {
    id: 'vurenn-max',
    name: 'Vurenn Max',
    description: 'Advanced reasoning, difficult analysis, coding, and complex writing.',
    status: 'available',
    minPlan: 'premier',
    badge: 'Premier',
    availabilityNote: {
      pro: 'Not included by default',
      premier: 'Very high limits',
    },
  },
  {
    id: 'vurenn-research',
    name: 'Vurenn Research',
    description: 'Source-oriented research, web investigation, and structured reports.',
    status: 'available',
    minPlan: 'pro',
    availabilityNote: {
      pro: 'Limited',
      premier: 'Substantially higher limits',
    },
  },
  {
    id: 'vurenn-apex',
    name: 'Vurenn Apex',
    description: 'Vurenn’s highest-capability model for the most difficult professional tasks.',
    // Not yet connected to a backend model — surfaced honestly as coming soon.
    status: FLAGS.apexEnabled ? 'comingSoon' : 'unavailable',
    minPlan: 'premier',
    badge: 'Premier',
    unavailableMessage: APEX_UNAVAILABLE_MESSAGE,
    availabilityNote: {
      premier: 'Highest access',
    },
  },
]

/** Default selection: the balanced everyday model, available to all plans. */
export const DEFAULT_MODEL_ID = 'vurenn'

const MODEL_BY_ID = new Map(MODELS.map((m) => [m.id, m]))

export function getModel(modelId: string): Model | undefined {
  return MODEL_BY_ID.get(modelId)
}

/** Models visible in UI (Apex hidden entirely when its flag is off). */
export function getVisibleModels(): Model[] {
  return MODELS.filter(
    (m) => !(m.id === 'vurenn-apex' && !FLAGS.apexEnabled),
  )
}
