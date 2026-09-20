import type { ChatStreamEvent } from '@/lib/api/types'
import { getPublicConfigSync } from '@/lib/config/public-config'
import type {
  ChatService,
  ChatStreamCallbacks,
  ChatStreamHandle,
  ChatStreamInput,
} from '@/lib/services/chat-service'
import type { Message } from '@/lib/types'
import { STORAGE_KEYS, storage } from '@/lib/utils/storage'
import { touchMockConversation } from './mock-conversation-service'

function loadMessages(): Record<string, Message[]> {
  return storage.get<Record<string, Message[]>>(STORAGE_KEYS.messages, {})
}

function saveThread(conversationId: string, thread: Message[]): void {
  const messages = loadMessages()
  messages[conversationId] = thread
  storage.set(STORAGE_KEYS.messages, messages)
}

function emit(
  callbacks: ChatStreamCallbacks,
  event: ChatStreamEvent,
): void {
  callbacks.onEvent(event)
}

export class MockChatService implements ChatService {
  async getMessages(conversationId: string): Promise<Message[]> {
    return loadMessages()[conversationId] ?? []
  }

  stream(
    input: ChatStreamInput,
    callbacks: ChatStreamCallbacks,
  ): ChatStreamHandle {
    let stopped = false
    const response = getPublicConfigSync().content.backendUnavailableMessage
    const userMessage: Message = {
      id: input.userMessageId,
      conversationId: input.conversationId,
      role: 'user',
      content: input.content,
      status: 'complete',
      attachments: input.attachments,
      createdAt: Date.now(),
      requestId: input.requestId,
    }
    const current = (loadMessages()[input.conversationId] ?? []).filter(
      (message) => message.id !== input.replaceAssistantId,
    )
    if (!current.some((message) => message.id === input.userMessageId)) {
      saveThread(input.conversationId, [...current, userMessage])
    } else if (input.replaceAssistantId) {
      saveThread(input.conversationId, current)
    }

    const completed = Promise.resolve().then(() => {
      if (stopped) return
      emit(callbacks, {
        type: 'message_started',
        data: { message_id: input.assistantMessageId },
      })
      emit(callbacks, { type: 'token', data: { text: response } })

      const messages = loadMessages()
      const thread = messages[input.conversationId] ?? []
      const assistant: Message = {
        id: input.assistantMessageId,
        conversationId: input.conversationId,
        role: 'assistant',
        content: response,
        status: 'complete',
        attachments: [],
        createdAt: Date.now(),
        requestId: input.requestId,
      }
      saveThread(input.conversationId, [
        ...thread.filter((message) => message.id !== assistant.id),
        assistant,
      ])
      touchMockConversation(input.conversationId)

      emit(callbacks, {
        type: 'message_completed',
        data: {
          message_id: input.assistantMessageId,
          conversation_id: input.conversationId,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      })
      emit(callbacks, { type: 'done', data: {} })
    })

    return {
      stop() {
        stopped = true
      },
      completed,
    }
  }
}

export const mockChatService = new MockChatService()
