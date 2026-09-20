import { apiClient } from '@/lib/api/client'
import { getFrontendEnv, selectServiceMode } from '@/lib/config/env'
import { getVisibleModels } from '@/lib/config/models'
import { mockAuthService } from '@/lib/mock/mock-auth-service'
import { mockChatService } from '@/lib/mock/mock-chat-service'
import { mockConversationService } from '@/lib/mock/mock-conversation-service'
import { mockFileService } from '@/lib/mock/mock-file-service'
import { mockSettingsService } from '@/lib/mock/mock-settings-service'
import {
  createSupabaseAuthService,
  createUnconfiguredAuthService,
  type AuthService,
} from './auth-service'
import { createHttpChatService, type ChatService } from './chat-service'
import {
  createHttpConversationService,
  type ConversationService,
} from './conversation-service'
import {
  createHttpFileService,
  createUnconfiguredFileService,
  type FileService,
} from './file-service'
import {
  canAccessConfiguredModel,
  createHttpModelService,
  type ModelService,
} from './model-service'
import {
  createEmptyProjectService,
  createHttpProjectService,
  type ProjectService,
} from './project-service'
import type { SettingsService } from './settings-service'
import { subscriptionService } from './subscription-service'
import { accountService } from './account-service'
import {
  createHttpDeveloperService,
  createUnavailableDeveloperService,
} from './developer-service'

const env = getFrontendEnv()
const mode = selectServiceMode(env.backendEnabled)

const mockModelService: ModelService = {
  async list() {
    return getVisibleModels()
  },
  canAccess: canAccessConfiguredModel,
}

const auth: AuthService = env.backendEnabled
  ? env.supabaseUrl && env.supabaseAnonKey
    ? createSupabaseAuthService()
    : createUnconfiguredAuthService()
  : mockAuthService
const chat: ChatService = env.backendEnabled
  ? createHttpChatService()
  : mockChatService
const conversations: ConversationService = env.backendEnabled
  ? createHttpConversationService()
  : mockConversationService
const models: ModelService = env.backendEnabled
  ? createHttpModelService()
  : mockModelService
const files: FileService = env.backendEnabled
  ? createHttpFileService()
  : mockFileService
const settings: SettingsService = mockSettingsService
const projects: ProjectService = env.backendEnabled
  ? createHttpProjectService()
  : createEmptyProjectService()
const developer = env.backendEnabled
  ? createHttpDeveloperService()
  : createUnavailableDeveloperService()

apiClient.setAccessTokenProvider(() => auth.getAccessToken())
apiClient.setUnauthorizedHandler(() => auth.signOut())

export const services = {
  mode,
  auth,
  chat,
  conversations,
  models,
  files,
  settings,
  projects,
  developer,
  subscriptions: subscriptionService,
  account: accountService,
}
