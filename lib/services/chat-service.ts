import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, normalizeApiError } from '@/lib/api/errors'
import { consumeSseResponse } from '@/lib/api/stream'
import type {
  BackendAttachment,
  BackendMessage,
  ChatStreamEvent,
  ChatStreamRequest,
  ConversationMessagesResponse,
} from '@/lib/api/types'
import type { Attachment, Message } from '@/lib/types'

export interface ChatStreamInput {
  conversationId: string
  content: string
  modelId: string
  attachments: Attachment[]
  requestId: string
  userMessageId: string
  assistantMessageId: string
  replaceAssistantId?: string
  voiceMode?: boolean
  tools?: string[]
}

export interface ChatStreamCallbacks {
  onEvent: (event: ChatStreamEvent) => void
  onError: (error: ApiError) => void
}

export interface ChatStreamHandle {
  stop(): void
  completed: Promise<void>
}

export interface ChatService {
  getMessages(conversationId: string): Promise<Message[]>
  stream(
    input: ChatStreamInput,
    callbacks: ChatStreamCallbacks,
  ): ChatStreamHandle
}

export function attachmentToBackend(
  attachment: Attachment,
): BackendAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    mime_type: attachment.type,
    size: attachment.size,
  }
}

export function backendMessageToMessage(value: BackendMessage): Message {
  const status: Message['status'] =
    value.status === 'completed'
      ? 'complete'
      : value.status === 'failed'
        ? 'error'
        : value.status === 'pending'
          ? 'sending'
          : value.status

  return {
    id: value.id,
    conversationId: value.conversation_id,
    role: value.role,
    content: value.content,
    status,
    attachments: value.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.mime_type,
      size: attachment.size,
      status: 'ready',
    })),
    createdAt: Date.parse(value.created_at),
  }
}

export function createHttpChatService(): ChatService {
  return {
    async getMessages(conversationId) {
      const response = await apiClient.request<ConversationMessagesResponse>(
        API_ENDPOINTS.conversationMessages(conversationId),
      )
      return response.messages.map(backendMessageToMessage)
    },
    stream(input, callbacks) {
      const controller = new AbortController()
      const request: ChatStreamRequest = {
        conversation_id: input.conversationId,
        message: input.content,
        model: input.modelId,
        attachments: input.attachments.map(attachmentToBackend),
        voice_mode: input.voiceMode,
        tools: input.tools,
      }

      const completed = (async () => {
        let terminalEventSeen = false
        try {
          const response = await apiClient.fetchResponse(
            API_ENDPOINTS.chatStream,
            {
              method: 'POST',
              body: request,
              signal: controller.signal,
              timeoutMs: input.tools?.includes('deep_research')
                ? 660_000
                : 180_000,
              headers: {
                accept: 'text/event-stream',
                'x-idempotency-key': input.requestId,
              },
            },
          )
          await consumeSseResponse(response, {
            signal: controller.signal,
            onEvent: (event) => {
              if (event.type === 'message_completed' || event.type === 'error') {
                terminalEventSeen = true
              }
              callbacks.onEvent(event)
            },
          })
          if (!terminalEventSeen) {
            throw new ApiError({
              status: 0,
              code: 'incomplete_stream',
              message: 'The response connection ended before Vurenn finished. Please retry.',
              retryable: true,
            })
          }
        } catch (error) {
          const normalized = normalizeApiError(error)
          if (normalized.code !== 'request_aborted') callbacks.onError(normalized)
          throw normalized
        }
      })()

      return {
        stop: () => controller.abort(),
        completed,
      }
    },
  }
}
