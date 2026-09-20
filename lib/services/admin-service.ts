import {
  adminAnnouncementService,
  adminAuditService,
  adminContentService,
  adminFeatureFlagService,
  adminFeatureService,
  adminLimitService,
  adminModelService,
  adminPlanService,
} from '@/lib/admin/mock-adapter'
import type {
  AdminAnnouncementService,
  AdminAuditService,
  AdminContentService,
  AdminFeatureFlagService,
  AdminFeatureService,
  AdminLimitService,
  AdminModelService,
  AdminPlanService,
} from '@/lib/admin/types'
import { ApiError } from '@/lib/api/errors'

export interface AdminUserSummary {
  id: string
  email: string
  role: string
  status: string
}

export interface AdminSystemStatus {
  service: string
  status: 'operational' | 'degraded' | 'offline'
  checkedAt: string
}

export interface AdminUserService {
  list(): Promise<AdminUserSummary[]>
}

export interface AdminSystemStatusService {
  get(): Promise<AdminSystemStatus[]>
}

export interface AdminService {
  plans: AdminPlanService
  models: AdminModelService
  features: AdminFeatureService
  limits: AdminLimitService
  content: AdminContentService
  announcements: AdminAnnouncementService
  flags: AdminFeatureFlagService
  audit: AdminAuditService
  users: AdminUserService
  systemStatus: AdminSystemStatusService
  secure: boolean
}

function unavailable(area: string): ApiError {
  return new ApiError({
    status: 0,
    code: 'secure_admin_backend_required',
    message: `${area} requires backend administrator authorization.`,
    retryable: false,
  })
}

/**
 * Development-only facade. The admin layout prominently marks this as
 * unsecured and production backend mode must replace the entire facade.
 */
export const developmentAdminService: AdminService = {
  plans: adminPlanService,
  models: adminModelService,
  features: adminFeatureService,
  limits: adminLimitService,
  content: adminContentService,
  announcements: adminAnnouncementService,
  flags: adminFeatureFlagService,
  audit: adminAuditService,
  users: {
    async list() {
      throw unavailable('User administration')
    },
  },
  systemStatus: {
    async get() {
      throw unavailable('System status')
    },
  },
  secure: false,
}
