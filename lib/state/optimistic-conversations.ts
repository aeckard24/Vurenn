import type { Conversation } from '@/lib/types'
import { STORAGE_KEYS, storage } from '@/lib/utils/storage'

const pendingCreations = new Map<string, Promise<Conversation>>()

function readStaged(): Conversation[] {
  return storage.get<Conversation[]>(STORAGE_KEYS.optimisticConversations, [])
}

function writeStaged(conversations: Conversation[]): void {
  storage.set(STORAGE_KEYS.optimisticConversations, conversations)
}

export function getStagedConversations(): Conversation[] {
  return readStaged()
}

export function stageConversation(
  conversation: Conversation,
  creation: Promise<Conversation>,
): void {
  const next = [
    conversation,
    ...readStaged().filter((item) => item.id !== conversation.id),
  ]
  writeStaged(next)
  pendingCreations.set(conversation.id, creation)
}

export function getPendingConversationCreation(
  conversationId: string,
): Promise<Conversation> | null {
  return pendingCreations.get(conversationId) ?? null
}

export function reconcileStagedConversation(
  temporaryId: string,
  conversation: Conversation,
): void {
  pendingCreations.delete(temporaryId)
  writeStaged(readStaged().filter((item) => item.id !== temporaryId))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('vurenn:conversation-reconciled', {
        detail: { temporaryId, conversation },
      }),
    )
  }
}

export function markStagedConversationFailed(
  temporaryId: string,
): void {
  pendingCreations.delete(temporaryId)
  writeStaged(
    readStaged().map((item) =>
      item.id === temporaryId ? { ...item, syncStatus: 'failed' } : item,
    ),
  )
}

export function mergeConversations(
  persisted: Conversation[],
  staged = readStaged(),
): Conversation[] {
  const byId = new Map<string, Conversation>()
  for (const conversation of [...staged, ...persisted]) {
    if (!byId.has(conversation.id)) byId.set(conversation.id, conversation)
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}
