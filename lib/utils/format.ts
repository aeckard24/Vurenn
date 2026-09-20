import type { Conversation, ConversationGroup } from '@/lib/types'

const DAY = 24 * 60 * 60 * 1000

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** e.g. "10:24 AM" for today, "May 24" for older. */
export function formatConversationTime(ts: number): string {
  const today = startOfDay(Date.now())
  const day = startOfDay(ts)
  const diffDays = Math.round((today - day) / DAY)
  if (diffDays <= 0) {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  if (diffDays === 1) {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function groupConversations(
  conversations: Conversation[],
): ConversationGroup[] {
  const today = startOfDay(Date.now())
  const buckets: Record<string, Conversation[]> = {
    today: [],
    yesterday: [],
    previous7: [],
    older: [],
  }

  for (const c of conversations) {
    const diffDays = Math.round((today - startOfDay(c.updatedAt)) / DAY)
    if (diffDays <= 0) buckets.today.push(c)
    else if (diffDays === 1) buckets.yesterday.push(c)
    else if (diffDays <= 7) buckets.previous7.push(c)
    else buckets.older.push(c)
  }

  const groups: ConversationGroup[] = [
    { key: 'today', label: 'Today', conversations: buckets.today },
    { key: 'yesterday', label: 'Yesterday', conversations: buckets.yesterday },
    {
      key: 'previous7',
      label: 'Previous 7 Days',
      conversations: buckets.previous7,
    },
    { key: 'older', label: 'Older', conversations: buckets.older },
  ]

  return groups.filter((g) => g.conversations.length > 0)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
