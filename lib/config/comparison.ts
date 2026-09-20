import type { PlanId } from '@/lib/types'

/**
 * Qualitative comparison values. We deliberately avoid fabricated numeric
 * counts until a backend cost model exists.
 */
export type ComparisonValue =
  | boolean
  | 'Limited'
  | 'Basic'
  | 'Standard'
  | 'Higher'
  | 'Very high'
  | 'Included'
  | 'Coming soon'

export interface ComparisonRow {
  label: string
  values: Record<PlanId, ComparisonValue>
}

export interface ComparisonGroup {
  title: string
  rows: ComparisonRow[]
}

export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    title: 'Core AI',
    rows: [
      { label: 'Vurenn Fast', values: { free: 'Included', pro: 'Higher', premier: 'Very high' } },
      { label: 'Vurenn', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Vurenn Max', values: { free: false, pro: false, premier: 'Very high' } },
      { label: 'Vurenn Research', values: { free: false, pro: 'Limited', premier: 'Very high' } },
      { label: 'Vurenn Apex', values: { free: false, pro: false, premier: 'Coming soon' } },
      { label: 'Response priority', values: { free: 'Standard', pro: 'Higher', premier: 'Very high' } },
    ],
  },
  {
    title: 'Research & tools',
    rows: [
      { label: 'Web search', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Deep research', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Data analysis', values: { free: 'Basic', pro: 'Higher', premier: 'Very high' } },
      { label: 'Source inspection', values: { free: 'Basic', pro: 'Included', premier: 'Included' } },
      { label: 'Tool usage', values: { free: 'Limited', pro: 'Included', premier: 'Included' } },
    ],
  },
  {
    title: 'Files & knowledge',
    rows: [
      { label: 'File uploads', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'File-size allowance', values: { free: 'Standard', pro: 'Higher', premier: 'Very high' } },
      { label: 'Files per conversation', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Project knowledge', values: { free: 'Basic', pro: 'Higher', premier: 'Very high' } },
      { label: 'Library storage', values: { free: 'Standard', pro: 'Higher', premier: 'Very high' } },
    ],
  },
  {
    title: 'Creation',
    rows: [
      { label: 'Image generation', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Writing Workspace', values: { free: false, pro: 'Included', premier: 'Included' } },
      { label: 'Code Workspace', values: { free: false, pro: 'Included', premier: 'Included' } },
      { label: 'Document export', values: { free: 'Basic', pro: 'Included', premier: 'Very high' } },
      { label: 'Generated-content history', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
    ],
  },
  {
    title: 'Organization',
    rows: [
      { label: 'Projects', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Project memory', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Conversation search', values: { free: 'Basic', pro: 'Higher', premier: 'Higher' } },
      { label: 'Chat branching', values: { free: false, pro: 'Included', premier: 'Included' } },
      { label: 'Library', values: { free: 'Basic', pro: 'Higher', premier: 'Very high' } },
    ],
  },
  {
    title: 'Automation',
    rows: [
      { label: 'Scheduled tasks', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Task frequency', values: { free: false, pro: 'Standard', premier: 'Higher' } },
      { label: 'Vurenn Assistants', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Plugins', values: { free: false, pro: 'Included', premier: 'Included' } },
      { label: 'Connectors', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Advanced agents', values: { free: false, pro: false, premier: 'Coming soon' } },
    ],
  },
  {
    title: 'Personalization',
    rows: [
      { label: 'Saved memory', values: { free: 'Limited', pro: 'Higher', premier: 'Very high' } },
      { label: 'Cross-chat memory', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Custom instructions', values: { free: 'Basic', pro: 'Included', premier: 'Included' } },
      { label: 'Appearance', values: { free: 'Standard', pro: 'Higher', premier: 'Higher' } },
      { label: 'Fonts', values: { free: 'Standard', pro: 'Higher', premier: 'Higher' } },
      { label: 'Voice', values: { free: 'Basic', pro: 'Higher', premier: 'Very high' } },
    ],
  },
  {
    title: 'Support & access',
    rows: [
      { label: 'Processing priority', values: { free: 'Standard', pro: 'Higher', premier: 'Very high' } },
      { label: 'Early features', values: { free: false, pro: 'Included', premier: 'Very high' } },
      { label: 'Support level', values: { free: 'Standard', pro: 'Included', premier: 'Very high' } },
    ],
  },
]

export function getPlanComparisonRows(): ComparisonGroup[] {
  return COMPARISON_GROUPS
}
