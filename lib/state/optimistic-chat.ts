import type { Attachment, Message } from '@/lib/types'
import { createClientId } from '@/lib/utils/id'
import { STORAGE_KEYS, storage } from '@/lib/utils/storage'
import { describeToolSubject, inferVisibleTools } from '@/lib/tools'

export interface PendingFirstMessage {
  conversationId: string
  modelId: string
  content: string
  attachments: Attachment[]
  requestId: string
  userMessage: Message
  assistantMessage: Message
  voiceMode?: boolean
  tools?: string[]
}

export function conversationRoute(conversationId: string): string {
  return `/chat/${encodeURIComponent(conversationId)}`
}

export function createPendingFirstMessage(input: {
  conversationId: string
  modelId: string
  content: string
  attachments: Attachment[]
  voiceMode?: boolean
  tools?: string[]
  now?: number
}): PendingFirstMessage {
  const createdAt = input.now ?? Date.now()
  const requestId = createClientId('req')
  const visibleTools = inferVisibleTools(
    input.content,
    input.attachments.length,
    input.tools,
  )
  return {
    conversationId: input.conversationId,
    modelId: input.modelId,
    content: input.content,
    attachments: input.attachments,
    voiceMode: input.voiceMode,
    tools: input.tools,
    requestId,
    userMessage: {
      id: createClientId('m_user'),
      conversationId: input.conversationId,
      role: 'user',
      content: input.content,
      status: 'complete',
      attachments: input.attachments,
      createdAt,
      requestId,
    },
    assistantMessage: {
      id: createClientId('m_assistant'),
      conversationId: input.conversationId,
      role: 'assistant',
      content: '',
      status: 'thinking',
      attachments: [],
      createdAt,
      requestId,
      toolCalls: visibleTools.map((name) => ({
        id: name,
        name,
        status: 'running',
        summary: describeToolSubject(input.content, name),
        estimatedSeconds: name === 'image_generation' ? 75 : undefined,
        estimatedReadyAt: name === 'image_generation'
          ? new Date(Date.now() + 75_000).toISOString()
          : undefined,
      })),
    },
  }
}

export function stageFirstMessage(value: PendingFirstMessage): void {
  storage.set(STORAGE_KEYS.pending(value.conversationId), value)
}

export function getPendingFirstMessage(
  conversationId: string,
): PendingFirstMessage | null {
  return storage.get<PendingFirstMessage | null>(
    STORAGE_KEYS.pending(conversationId),
    null,
  )
}

export function clearPendingFirstMessage(conversationId: string): void {
  storage.remove(STORAGE_KEYS.pending(conversationId))
}

export function replacePendingConversationId(
  temporaryId: string,
  conversationId: string,
): PendingFirstMessage | null {
  const pending = getPendingFirstMessage(temporaryId)
  if (!pending) return null
  const replaceMessage = (message: Message): Message => ({
    ...message,
    conversationId,
  })
  const updated: PendingFirstMessage = {
    ...pending,
    conversationId,
    userMessage: replaceMessage(pending.userMessage),
    assistantMessage: replaceMessage(pending.assistantMessage),
  }
  clearPendingFirstMessage(temporaryId)
  stageFirstMessage(updated)
  return updated
}

export function replaceMessageConversationId(
  messages: Message[],
  conversationId: string,
): Message[] {
  return messages.map((message) => ({ ...message, conversationId }))
}
