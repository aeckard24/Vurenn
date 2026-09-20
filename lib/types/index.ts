export type PlanId = 'free' | 'pro' | 'premier'

export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl?: string | null
  plan: PlanId
}

export type BillingInterval = 'monthly' | 'annual'

/** Boolean capability keys gated by plan. */
export type EntitlementKey =
  | 'useVurennFast'
  | 'useVurenn'
  | 'useVurennMax'
  | 'useVurennResearch'
  | 'useVurennApex'
  | 'webSearch'
  | 'deepResearch'
  | 'fileUploads'
  | 'expandedFileUploads'
  | 'dataAnalysis'
  | 'imageGeneration'
  | 'voice'
  | 'savedMemory'
  | 'crossConversationMemory'
  | 'projectMemory'
  | 'projects'
  | 'expandedProjects'
  | 'library'
  | 'expandedStorage'
  | 'scheduledTasks'
  | 'advancedScheduledTasks'
  | 'customAssistants'
  | 'expandedAssistants'
  | 'plugins'
  | 'connectors'
  | 'workspace'
  | 'workspaceHistory'
  | 'advancedExports'
  | 'advancedAppearance'
  | 'fontSelection'
  | 'priorityProcessing'
  | 'earlyAccess'
  | 'prioritySupport'
  | 'advancedAgents'

/**
 * Limit values are intentionally qualitative until a backend cost model exists.
 * `null` means "not available" and must never be interpreted as unlimited.
 */
export type LimitValue =
  | number
  | null
  | 'dynamic'
  | 'veryHigh'
  | 'backendDefined'

export type LimitKey =
  | 'messages'
  | 'advancedMessages'
  | 'researchRequests'
  | 'deepResearchRequests'
  | 'fileUploads'
  | 'filesPerConversation'
  | 'maximumFileSize'
  | 'imageGenerations'
  | 'projects'
  | 'projectFiles'
  | 'savedMemories'
  | 'scheduledTasks'
  | 'taskFrequency'
  | 'assistants'
  | 'assistantFiles'
  | 'libraryStorage'
  | 'voiceMinutes'
  | 'connectorActions'

export interface PlanPrice {
  monthly: number
  annual: number
}

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  description: string
  price: PlanPrice
  badge?: string
  highlight?: boolean
  featured?: boolean
  ctaLabel: string
  /** Short marketing bullets surfaced on the pricing card. */
  highlights: string[]
  entitlements: Partial<Record<EntitlementKey, boolean>>
  limits: Partial<Record<LimitKey, LimitValue>>
}

export type ModelStatus =
  | 'available'
  | 'unavailable'
  | 'comingSoon'
  | 'backendRequired'
  | 'maintenance'

export interface Model {
  id: string
  name: string
  description: string
  status: ModelStatus
  /** Lowest plan that can select this model. */
  minPlan: PlanId
  /** Per-plan availability note shown in menus/comparison. */
  availabilityNote?: Partial<Record<PlanId, string>>
  badge?: string
  /** Message shown when the model is not yet connected. */
  unavailableMessage?: string
}

export interface Conversation {
  id: string
  title: string
  modelId: string
  projectId?: string | null
  createdAt: number
  updatedAt: number
  isPinned: boolean
  isArchived: boolean
  unread: boolean
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'status'

export type MessageStatus =
  | 'complete'
  | 'sending'
  | 'thinking'
  | 'streaming'
  | 'error'
  | 'stopped'

export type AttachmentStatus = 'ready' | 'uploading' | 'error'

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  previewUrl?: string | null
  status: AttachmentStatus
  progress?: number
  error?: string
}

export interface MessageSource {
  id: string
  title: string
  url: string | null
}

export interface MessageToolCall {
  id: string
  name: string
  status: 'running' | 'completed'
  summary?: string
  estimatedSeconds?: number
  stageIndex?: number
  detail?: string
  estimatedReadyAt?: string
}

export interface MessageUsage {
  inputTokens: number
  outputTokens: number
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  attachments: Attachment[]
  createdAt: number
  error?: string
  sources?: MessageSource[]
  toolCalls?: MessageToolCall[]
  usage?: MessageUsage
  requestId?: string
}

export type ConversationGroupKey = 'today' | 'yesterday' | 'previous7' | 'older'

export interface ConversationGroup {
  key: ConversationGroupKey
  label: string
  conversations: Conversation[]
}
