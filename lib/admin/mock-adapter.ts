/**
 * Admin mock adapter — implements all admin service interfaces with
 * in-memory fixture data. Swap this for an HTTP adapter that calls
 * your real /admin/v1/* endpoints without touching any UI code.
 *
 * All data here is clearly labelled as fixture data. No real operational
 * values are implied.
 */

import type {
  AdminAnnouncement,
  AdminAnnouncementService,
  AdminAuditService,
  AdminContent,
  AdminContentService,
  AdminFeature,
  AdminFeatureFlag,
  AdminFeatureFlagService,
  AdminFeatureService,
  AdminLimitService,
  AdminLimits,
  AdminModel,
  AdminModelService,
  AdminPlan,
  AdminPlanService,
  AuditEntry,
} from "./types"

const NOW = new Date().toISOString()
const ACTOR = "admin@vurenn.com"

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const plans: AdminPlan[] = [
  {
    id: "plan_free",
    internalId: "free",
    displayName: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started with Vurenn at no cost.",
    badge: "FREE",
    displayOrder: 1,
    enabled: true,
    recommended: false,
    features: ["Vurenn Fast model", "Limited messages", "Basic chat history"],
    upgradeWording: "Upgrade to Pro",
    downgradeWording: "",
    fairUseWording: "Subject to fair-use limits.",
    status: "published",
    updatedAt: NOW,
    updatedBy: ACTOR,
  },
  {
    id: "plan_pro",
    internalId: "pro",
    displayName: "Pro",
    monthlyPrice: 9.99,
    annualPrice: 99,
    description: "For individuals who want more power and speed.",
    badge: "PRO",
    displayOrder: 2,
    enabled: true,
    recommended: true,
    features: ["All Free features", "Vurenn + Vurenn Research", "Higher message limits", "File uploads"],
    upgradeWording: "Upgrade to Premier",
    downgradeWording: "Downgrade to Free",
    fairUseWording: "Subject to fair-use limits.",
    status: "published",
    updatedAt: NOW,
    updatedBy: ACTOR,
  },
  {
    id: "plan_premier",
    internalId: "premier",
    displayName: "Premier",
    monthlyPrice: 19.99,
    annualPrice: 199,
    description: "Maximum capability for power users and teams.",
    badge: "PREMIER",
    displayOrder: 3,
    enabled: true,
    recommended: false,
    features: ["All Pro features", "Vurenn Max + Apex (coming soon)", "Very high limits", "Priority support"],
    upgradeWording: "",
    downgradeWording: "Downgrade to Pro",
    fairUseWording: "Subject to fair-use limits.",
    status: "published",
    updatedAt: NOW,
    updatedBy: ACTOR,
  },
]

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

const models: AdminModel[] = [
  {
    id: "vurenn-fast",
    displayName: "Vurenn Fast",
    internalId: "vurenn-fast",
    description: "Fastest responses for everyday tasks.",
    availabilityStatus: "available",
    requiredPlan: "free",
    displayOrder: 1,
    badge: "",
    enabled: true,
    comingSoon: false,
    maintenance: false,
    unavailableMessage: "",
    capabilities: ["chat", "summarize"],
    supportedTools: ["web-search"],
    backendModelIdPlaceholder: "<!-- connect backend -->",
    status: "published",
    updatedAt: NOW,
  },
  {
    id: "vurenn",
    displayName: "Vurenn",
    internalId: "vurenn",
    description: "Balanced performance for most tasks.",
    availabilityStatus: "available",
    requiredPlan: "pro",
    displayOrder: 2,
    badge: "",
    enabled: true,
    comingSoon: false,
    maintenance: false,
    unavailableMessage: "",
    capabilities: ["chat", "summarize", "analyze"],
    supportedTools: ["web-search", "upload-files"],
    backendModelIdPlaceholder: "<!-- connect backend -->",
    status: "published",
    updatedAt: NOW,
  },
  {
    id: "vurenn-max",
    displayName: "Vurenn Max",
    internalId: "vurenn-max",
    description: "High-capability model for complex reasoning.",
    availabilityStatus: "available",
    requiredPlan: "premier",
    displayOrder: 3,
    badge: "PREMIER",
    enabled: true,
    comingSoon: false,
    maintenance: false,
    unavailableMessage: "Vurenn Max requires a Premier plan.",
    capabilities: ["chat", "summarize", "analyze", "deep-research"],
    supportedTools: ["web-search", "upload-files", "data-analysis"],
    backendModelIdPlaceholder: "<!-- connect backend -->",
    status: "published",
    updatedAt: NOW,
  },
  {
    id: "vurenn-research",
    displayName: "Vurenn Research",
    internalId: "vurenn-research",
    description: "Optimized for long-form research and citations.",
    availabilityStatus: "available",
    requiredPlan: "pro",
    displayOrder: 4,
    badge: "",
    enabled: true,
    comingSoon: false,
    maintenance: false,
    unavailableMessage: "",
    capabilities: ["chat", "research", "citations"],
    supportedTools: ["web-search", "deep-research"],
    backendModelIdPlaceholder: "<!-- connect backend -->",
    status: "published",
    updatedAt: NOW,
  },
  {
    id: "vurenn-apex",
    displayName: "Vurenn Apex",
    internalId: "vurenn-apex",
    description: "Next-generation flagship model.",
    availabilityStatus: "coming-soon",
    requiredPlan: "premier",
    displayOrder: 5,
    badge: "COMING SOON",
    enabled: false,
    comingSoon: true,
    maintenance: false,
    unavailableMessage: "Vurenn Apex is coming soon. Check back later.",
    capabilities: [],
    supportedTools: [],
    backendModelIdPlaceholder: "<!-- connect backend -->",
    status: "draft",
    updatedAt: NOW,
  },
]

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: AdminFeature[] = [
  { id: "f_chat", key: "chat", publicName: "Chat", description: "Core conversational AI.", category: "chat", enabled: true, requiredPlan: "free", comingSoon: false, backendRequired: true, navigationVisible: true, beta: false, upgradeMessage: "", helpDocRef: "", displayOrder: 1, status: "published", updatedAt: NOW },
  { id: "f_research", key: "deep-research", publicName: "Deep Research", description: "Long-form research with citations.", category: "research", enabled: true, requiredPlan: "pro", comingSoon: false, backendRequired: true, navigationVisible: true, beta: false, upgradeMessage: "Upgrade to Pro for Deep Research.", helpDocRef: "", displayOrder: 2, status: "published", updatedAt: NOW },
  { id: "f_files", key: "file-uploads", publicName: "File Uploads", description: "Attach and analyze local files.", category: "files", enabled: true, requiredPlan: "pro", comingSoon: false, backendRequired: true, navigationVisible: true, beta: false, upgradeMessage: "Upgrade to Pro to upload files.", helpDocRef: "", displayOrder: 3, status: "published", updatedAt: NOW },
  { id: "f_images", key: "image-generation", publicName: "Image Generation", description: "Generate images from prompts.", category: "images", enabled: false, requiredPlan: "pro", comingSoon: true, backendRequired: true, navigationVisible: false, beta: false, upgradeMessage: "", helpDocRef: "", displayOrder: 4, status: "draft", updatedAt: NOW },
  { id: "f_projects", key: "projects", publicName: "Projects", description: "Organize chats into projects.", category: "projects", enabled: false, requiredPlan: "pro", comingSoon: true, backendRequired: true, navigationVisible: false, beta: false, upgradeMessage: "", helpDocRef: "", displayOrder: 5, status: "draft", updatedAt: NOW },
  { id: "f_memory", key: "memory", publicName: "Memory", description: "Persistent memory across sessions.", category: "memory", enabled: false, requiredPlan: "premier", comingSoon: true, backendRequired: true, navigationVisible: false, beta: false, upgradeMessage: "", helpDocRef: "", displayOrder: 6, status: "draft", updatedAt: NOW },
  { id: "f_voice", key: "voice", publicName: "Voice", description: "Voice input and output.", category: "voice", enabled: false, requiredPlan: "premier", comingSoon: true, backendRequired: true, navigationVisible: false, beta: false, upgradeMessage: "", helpDocRef: "", displayOrder: 7, status: "draft", updatedAt: NOW },
]

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const defaultLimits: AdminLimits = {
  free: {
    messages: { type: "limited", value: 20 },
    advancedMessages: { type: "not-available" },
    researchRequests: { type: "not-available" },
    fileUploads: { type: "not-available" },
    filesPerConversation: { type: "not-available" },
    maxFileSizeMb: { type: "not-available" },
    imageGenerations: { type: "not-available" },
    projects: { type: "not-available" },
    projectFiles: { type: "not-available" },
    memories: { type: "not-available" },
    scheduledTasks: { type: "not-available" },
    assistants: { type: "not-available" },
    storageMb: { type: "not-available" },
    voiceMinutes: { type: "not-available" },
    connectorActions: { type: "not-available" },
  },
  pro: {
    messages: { type: "higher" },
    advancedMessages: { type: "standard" },
    researchRequests: { type: "standard" },
    fileUploads: { type: "standard" },
    filesPerConversation: { type: "limited", value: 5 },
    maxFileSizeMb: { type: "numeric", value: 20 },
    imageGenerations: { type: "backend-defined" },
    projects: { type: "backend-defined" },
    projectFiles: { type: "backend-defined" },
    memories: { type: "not-available" },
    scheduledTasks: { type: "not-available" },
    assistants: { type: "not-available" },
    storageMb: { type: "backend-defined" },
    voiceMinutes: { type: "not-available" },
    connectorActions: { type: "not-available" },
  },
  premier: {
    messages: { type: "very-high" },
    advancedMessages: { type: "higher" },
    researchRequests: { type: "higher" },
    fileUploads: { type: "higher" },
    filesPerConversation: { type: "limited", value: 20 },
    maxFileSizeMb: { type: "numeric", value: 100 },
    imageGenerations: { type: "backend-defined" },
    projects: { type: "backend-defined" },
    projectFiles: { type: "backend-defined" },
    memories: { type: "backend-defined" },
    scheduledTasks: { type: "backend-defined" },
    assistants: { type: "backend-defined" },
    storageMb: { type: "backend-defined" },
    voiceMinutes: { type: "backend-defined" },
    connectorActions: { type: "backend-defined" },
  },
  updatedAt: NOW,
  updatedBy: ACTOR,
  status: "published",
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const content: AdminContent[] = [
  { id: "c_disclaimer", key: "accuracy-disclaimer", title: "Accuracy Disclaimer", content: "Vurenn can make mistakes. Please verify important information.", draftContent: "", status: "published", updatedAt: NOW, updatedBy: ACTOR },
  { id: "c_backend", key: "backend-unavailable", title: "Backend Unavailable Message", content: "Backend not developed. Please check back later.", draftContent: "", status: "published", updatedAt: NOW, updatedBy: ACTOR },
  { id: "c_welcome_heading", key: "welcome-heading", title: "Welcome Heading", content: "What do you want to know?", draftContent: "", status: "published", updatedAt: NOW, updatedBy: ACTOR },
  { id: "c_tagline", key: "tagline", title: "Tagline", content: "Clarity over confidence. Always.", draftContent: "", status: "published", updatedAt: NOW, updatedBy: ACTOR },
  { id: "c_maintenance_msg", key: "maintenance-message", title: "System Maintenance Message", content: "Vurenn is temporarily offline for scheduled maintenance. We'll be back shortly.", draftContent: "", status: "published", updatedAt: NOW, updatedBy: ACTOR },
]

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

const announcements: AdminAnnouncement[] = []

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

const flags: AdminFeatureFlag[] = [
  { id: "ff_backend", key: "backendEnabled", description: "Real backend API connected.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_billing", key: "billingEnabled", description: "Stripe billing active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_auth", key: "authenticationEnabled", description: "Real auth provider connected.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_files", key: "fileUploadsEnabled", description: "File upload processing active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_images", key: "imageGenerationEnabled", description: "Image generation model active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_tasks", key: "scheduledTasksEnabled", description: "Scheduled task engine active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_plugins", key: "pluginsEnabled", description: "Plugin directory active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_voice", key: "voiceEnabled", description: "Voice I/O active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_apex", key: "apexModelEnabled", description: "Vurenn Apex model available.", enabled: false, environment: "all", targetPlans: ["premier"], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
  { id: "ff_workspace", key: "workspaceEnabled", description: "Workspace/team features active.", enabled: false, environment: "all", targetPlans: [], targetPercentage: 0, startDate: "", endDate: "", emergencyDisabled: false, updatedAt: NOW },
]

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

const auditEntries: AuditEntry[] = [
  { id: "ae_1", actor: ACTOR, role: "administrator", action: "publish", resourceType: "plan", resourceId: "plan_pro", prevValueSummary: "status: draft", newValueSummary: "status: published", timestamp: NOW, ipAddressPlaceholder: "0.0.0.0", result: "success" },
  { id: "ae_2", actor: ACTOR, role: "administrator", action: "update", resourceType: "content", resourceId: "c_backend", prevValueSummary: "content: (previous)", newValueSummary: "content: Backend not developed...", timestamp: NOW, ipAddressPlaceholder: "0.0.0.0", result: "success" },
]

// ---------------------------------------------------------------------------
// Adapter implementations
// ---------------------------------------------------------------------------

function delay(ms = 60) { return new Promise<void>((r) => setTimeout(r, ms)) }
function uid(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}` }

export const adminPlanService: AdminPlanService = {
  async listPlans() { await delay(); return [...plans] },
  async getPlan(id) { await delay(); return plans.find((p) => p.id === id)! },
  async updatePlan(id, patch) {
    await delay()
    const i = plans.findIndex((p) => p.id === id)
    plans[i] = { ...plans[i], ...patch, updatedAt: new Date().toISOString() }
    return plans[i]
  },
  async publishPlan(id) { return adminPlanService.updatePlan(id, { status: "published" }) },
  async archivePlan(id) { return adminPlanService.updatePlan(id, { status: "archived" }) },
}

export const adminModelService: AdminModelService = {
  async listModels() { await delay(); return [...models] },
  async updateModel(id, patch) {
    await delay()
    const i = models.findIndex((m) => m.id === id)
    models[i] = { ...models[i], ...patch, updatedAt: new Date().toISOString() }
    return models[i]
  },
  async publishModel(id) { return adminModelService.updateModel(id, { status: "published" }) },
}

export const adminFeatureService: AdminFeatureService = {
  async listFeatures() { await delay(); return [...features] },
  async updateFeature(id, patch) {
    await delay()
    const i = features.findIndex((f) => f.id === id)
    features[i] = { ...features[i], ...patch, updatedAt: new Date().toISOString() }
    return features[i]
  },
  async publishFeature(id) { return adminFeatureService.updateFeature(id, { status: "published" }) },
}

let limitsState = { ...defaultLimits }
export const adminLimitService: AdminLimitService = {
  async getLimits() { await delay(); return { ...limitsState } },
  async updateLimits(patch) {
    await delay()
    limitsState = { ...limitsState, ...patch, updatedAt: new Date().toISOString() }
    return limitsState
  },
  async publishLimits() { return adminLimitService.updateLimits({ status: "published" }) },
}

export const adminContentService: AdminContentService = {
  async listContent() { await delay(); return [...content] },
  async getContent(id) { await delay(); return content.find((c) => c.id === id)! },
  async updateContent(id, patch) {
    await delay()
    const i = content.findIndex((c) => c.id === id)
    content[i] = { ...content[i], ...patch, updatedAt: new Date().toISOString() }
    return content[i]
  },
  async publishContent(id) { return adminContentService.updateContent(id, { status: "published" }) },
  async archiveContent(id) { return adminContentService.updateContent(id, { status: "archived" }) },
}

export const adminAnnouncementService: AdminAnnouncementService = {
  async listAnnouncements() { await delay(); return [...announcements] },
  async createAnnouncement(data) {
    await delay()
    const entry: AdminAnnouncement = { id: uid("ann"), ...data, updatedAt: new Date().toISOString() }
    announcements.push(entry)
    return entry
  },
  async updateAnnouncement(id, patch) {
    await delay()
    const i = announcements.findIndex((a) => a.id === id)
    announcements[i] = { ...announcements[i], ...patch, updatedAt: new Date().toISOString() }
    return announcements[i]
  },
  async deleteAnnouncement(id) {
    await delay()
    const i = announcements.findIndex((a) => a.id === id)
    if (i >= 0) announcements.splice(i, 1)
  },
}

export const adminFeatureFlagService: AdminFeatureFlagService = {
  async listFlags() { await delay(); return [...flags] },
  async updateFlag(id, patch) {
    await delay()
    const i = flags.findIndex((f) => f.id === id)
    flags[i] = { ...flags[i], ...patch, updatedAt: new Date().toISOString() }
    return flags[i]
  },
}

export const adminAuditService: AdminAuditService = {
  async listAuditEntries(limit = 50) { await delay(); return auditEntries.slice(0, limit) },
}
