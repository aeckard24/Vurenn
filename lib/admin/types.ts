/**
 * Admin service types — frontend interfaces for the Vurenn administration layer.
 *
 * These types define the shape of data exchanged between the admin UI and the
 * backend. Mock adapters live in lib/admin/mock-adapter.ts. A future HTTP
 * adapter can implement the same interfaces without touching any UI code.
 *
 * IMPORTANT: None of these types should ever carry secrets, provider API keys,
 * or confidential model-routing details. Those must live exclusively on the
 * backend.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type PublishStatus = "draft" | "published" | "archived"
export type Plan = "free" | "pro" | "premier"
export type AdminRole = "user" | "support" | "editor" | "administrator" | "owner"
export type LimitValue =
  | { type: "not-available" }
  | { type: "backend-defined" }
  | { type: "dynamic" }
  | { type: "limited"; value: number }
  | { type: "standard" }
  | { type: "higher" }
  | { type: "very-high" }
  | { type: "numeric"; value: number }

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export interface AdminPlan {
  id: string
  internalId: string
  displayName: string
  monthlyPrice: number
  annualPrice: number
  description: string
  badge: string
  displayOrder: number
  enabled: boolean
  recommended: boolean
  features: string[]
  upgradeWording: string
  downgradeWording: string
  fairUseWording: string
  status: PublishStatus
  updatedAt: string
  updatedBy: string
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export interface AdminModel {
  id: string
  displayName: string
  internalId: string
  description: string
  availabilityStatus: "available" | "maintenance" | "coming-soon" | "disabled"
  requiredPlan: Plan
  displayOrder: number
  badge: string
  enabled: boolean
  comingSoon: boolean
  maintenance: boolean
  unavailableMessage: string
  capabilities: string[]
  supportedTools: string[]
  /** Intentionally opaque — backend uses this, frontend should never render it. */
  backendModelIdPlaceholder: string
  status: PublishStatus
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export type FeatureCategory =
  | "chat" | "research" | "files" | "images" | "projects"
  | "memory" | "tasks" | "assistants" | "plugins" | "workspace"
  | "voice" | "appearance" | "security"

export interface AdminFeature {
  id: string
  key: string
  publicName: string
  description: string
  category: FeatureCategory
  enabled: boolean
  requiredPlan: Plan
  comingSoon: boolean
  backendRequired: boolean
  navigationVisible: boolean
  beta: boolean
  upgradeMessage: string
  helpDocRef: string
  displayOrder: number
  status: PublishStatus
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export interface PlanLimits {
  messages: LimitValue
  advancedMessages: LimitValue
  researchRequests: LimitValue
  fileUploads: LimitValue
  filesPerConversation: LimitValue
  maxFileSizeMb: LimitValue
  imageGenerations: LimitValue
  projects: LimitValue
  projectFiles: LimitValue
  memories: LimitValue
  scheduledTasks: LimitValue
  assistants: LimitValue
  storageMb: LimitValue
  voiceMinutes: LimitValue
  connectorActions: LimitValue
}

export interface AdminLimits {
  free: PlanLimits
  pro: PlanLimits
  premier: PlanLimits
  updatedAt: string
  updatedBy: string
  status: PublishStatus
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface AdminContent {
  id: string
  key: string
  title: string
  content: string
  draftContent: string
  status: PublishStatus
  updatedAt: string
  updatedBy: string
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export type AnnouncementType = "info" | "feature" | "maintenance" | "warning" | "promotion"

export interface AdminAnnouncement {
  id: string
  title: string
  message: string
  type: AnnouncementType
  startDate: string
  endDate: string
  targetPlans: Plan[]
  targetPages: string[]
  dismissible: boolean
  enabled: boolean
  linkLabel: string
  linkDestination: string
  priority: number
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export interface AdminFeatureFlag {
  id: string
  key: string
  description: string
  enabled: boolean
  environment: "all" | "production" | "staging" | "development"
  targetPlans: Plan[]
  targetPercentage: number
  startDate: string
  endDate: string
  emergencyDisabled: boolean
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string
  actor: string
  role: AdminRole
  action: string
  resourceType: string
  resourceId: string
  prevValueSummary: string
  newValueSummary: string
  timestamp: string
  ipAddressPlaceholder: string
  result: "success" | "failure"
}

// ---------------------------------------------------------------------------
// Service interfaces
// ---------------------------------------------------------------------------

export interface AdminPlanService {
  listPlans(): Promise<AdminPlan[]>
  getPlan(id: string): Promise<AdminPlan>
  updatePlan(id: string, patch: Partial<AdminPlan>): Promise<AdminPlan>
  publishPlan(id: string): Promise<AdminPlan>
  archivePlan(id: string): Promise<AdminPlan>
}

export interface AdminModelService {
  listModels(): Promise<AdminModel[]>
  updateModel(id: string, patch: Partial<AdminModel>): Promise<AdminModel>
  publishModel(id: string): Promise<AdminModel>
}

export interface AdminFeatureService {
  listFeatures(): Promise<AdminFeature[]>
  updateFeature(id: string, patch: Partial<AdminFeature>): Promise<AdminFeature>
  publishFeature(id: string): Promise<AdminFeature>
}

export interface AdminLimitService {
  getLimits(): Promise<AdminLimits>
  updateLimits(patch: Partial<AdminLimits>): Promise<AdminLimits>
  publishLimits(): Promise<AdminLimits>
}

export interface AdminContentService {
  listContent(): Promise<AdminContent[]>
  getContent(id: string): Promise<AdminContent>
  updateContent(id: string, patch: Partial<AdminContent>): Promise<AdminContent>
  publishContent(id: string): Promise<AdminContent>
  archiveContent(id: string): Promise<AdminContent>
}

export interface AdminAnnouncementService {
  listAnnouncements(): Promise<AdminAnnouncement[]>
  createAnnouncement(data: Omit<AdminAnnouncement, "id" | "updatedAt">): Promise<AdminAnnouncement>
  updateAnnouncement(id: string, patch: Partial<AdminAnnouncement>): Promise<AdminAnnouncement>
  deleteAnnouncement(id: string): Promise<void>
}

export interface AdminFeatureFlagService {
  listFlags(): Promise<AdminFeatureFlag[]>
  updateFlag(id: string, patch: Partial<AdminFeatureFlag>): Promise<AdminFeatureFlag>
}

export interface AdminAuditService {
  listAuditEntries(limit?: number): Promise<AuditEntry[]>
}
