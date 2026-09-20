import type { CreateConversationInput } from '@/lib/api/types'
import type { ConversationService } from '@/lib/services/conversation-service'
import type { Conversation } from '@/lib/types'
import { STORAGE_KEYS, storage } from '@/lib/utils/storage'
import { MOCK_CONVERSATIONS } from './data'

function loadConversations(): Conversation[] {
  const existing = storage.get<Conversation[] | null>(
    STORAGE_KEYS.conversations,
    null,
  )
  if (existing) return existing
  storage.set(STORAGE_KEYS.conversations, MOCK_CONVERSATIONS)
  return MOCK_CONVERSATIONS
}

function saveConversations(conversations: Conversation[]): void {
  storage.set(STORAGE_KEYS.conversations, conversations)
}

function updateConversation(
  id: string,
  patch: Partial<Conversation>,
): Conversation {
  const conversations = loadConversations()
  const index = conversations.findIndex((conversation) => conversation.id === id)
  if (index < 0) throw new Error('Conversation not found')
  const updated = {
    ...conversations[index],
    ...patch,
    updatedAt: Date.now(),
  }
  const next = [...conversations]
  next[index] = updated
  saveConversations(next)
  return updated
}

export function touchMockConversation(id: string): void {
  updateConversation(id, {})
}

export class MockConversationService implements ConversationService {
  async list(): Promise<Conversation[]> {
    return loadConversations()
      .filter((conversation) => !conversation.isArchived)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }

  async get(id: string): Promise<Conversation | null> {
    return loadConversations().find((conversation) => conversation.id === id) ?? null
  }

  async create(input: CreateConversationInput): Promise<Conversation> {
    const existing = await this.get(input.temporaryId)
    if (existing) return existing
    const now = Date.now()
    const conversation: Conversation = {
      id: input.temporaryId,
      title: input.title.trim() || 'New chat',
      modelId: input.modelId,
      projectId: input.projectId ?? null,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      isArchived: false,
      unread: false,
      syncStatus: 'synced',
    }
    saveConversations([conversation, ...loadConversations()])
    return conversation
  }

  async rename(id: string, title: string): Promise<Conversation> {
    return updateConversation(id, { title: title.trim() || 'Untitled' })
  }

  async pin(id: string, pinned: boolean): Promise<Conversation> {
    return updateConversation(id, { isPinned: pinned })
  }

  async archive(id: string, archived: boolean): Promise<Conversation> {
    return updateConversation(id, { isArchived: archived })
  }

  async delete(id: string): Promise<void> {
    saveConversations(
      loadConversations().filter((conversation) => conversation.id !== id),
    )
    const messages = storage.get<Record<string, unknown[]>>(
      STORAGE_KEYS.messages,
      {},
    )
    delete messages[id]
    storage.set(STORAGE_KEYS.messages, messages)
  }

  async clearAll(): Promise<void> {
    saveConversations([])
    storage.set(STORAGE_KEYS.messages, {})
  }
}

export const mockConversationService = new MockConversationService()
