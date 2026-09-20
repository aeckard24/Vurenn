import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/errors'
import type {
  BackendConversation,
  CreateConversationInput,
  CreateConversationRequest,
  CreateConversationResponse,
  ListConversationsResponse,
} from '@/lib/api/types'
import type { Conversation } from '@/lib/types'

export interface ConversationService {
  list(): Promise<Conversation[]>
  get(id: string): Promise<Conversation | null>
  create(input: CreateConversationInput): Promise<Conversation>
  rename(id: string, title: string): Promise<Conversation>
  pin(id: string, pinned: boolean): Promise<Conversation>
  archive(id: string, archived: boolean): Promise<Conversation>
  delete(id: string): Promise<void>
  clearAll(): Promise<void>
}

export function backendConversationToConversation(
  value: BackendConversation,
): Conversation {
  return {
    id: value.id,
    title: value.title,
    modelId: value.model_id,
    projectId: value.project_id,
    createdAt: Date.parse(value.created_at),
    updatedAt: Date.parse(value.updated_at),
    isPinned: false,
    isArchived: false,
    unread: false,
    syncStatus: 'synced',
  }
}

function unsupported(operation: string): ApiError {
  return new ApiError({
    status: 0,
    code: 'backend_contract_pending',
    message: `${operation} is not part of the agreed Python backend contract yet.`,
    retryable: false,
  })
}

export function createHttpConversationService(): ConversationService {
  return {
    async list() {
      const response = await apiClient.request<ListConversationsResponse>(
        API_ENDPOINTS.conversations,
      )
      return response.conversations.map(backendConversationToConversation)
    },
    async get(id) {
      const conversations = await this.list()
      return conversations.find((conversation) => conversation.id === id) ?? null
    },
    async create(input) {
      const request: CreateConversationRequest = {
        temporary_id: input.temporaryId,
        title: input.title,
        model_id: input.modelId,
        project_id: input.projectId ?? null,
      }
      const response = await apiClient.request<CreateConversationResponse>(
        API_ENDPOINTS.conversations,
        {
          method: 'POST',
          body: request,
          headers: { 'x-idempotency-key': input.temporaryId },
        },
      )
      return backendConversationToConversation(response)
    },
    async rename() {
      throw unsupported('Conversation rename')
    },
    async pin() {
      throw unsupported('Conversation pinning')
    },
    async archive() {
      throw unsupported('Conversation archiving')
    },
    async delete(id) {
      await apiClient.request<void>(API_ENDPOINTS.conversation(id), {
        method: 'DELETE',
      })
    },
    async clearAll() {
      await apiClient.request<void>(API_ENDPOINTS.conversations, {
        method: 'DELETE',
      })
    },
  }
}
