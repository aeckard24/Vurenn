export type ShortcutAction =
  | 'new_chat'
  | 'focus_composer'
  | 'search_conversations'
  | 'toggle_sidebar'
  | 'toggle_theme'
  | 'open_settings'
  | 'go_back'

export interface ShortcutEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export const SHORTCUT_REFERENCE = [
  { action: 'New chat', keys: ['Ctrl', 'Alt', 'N'] },
  { action: 'Focus composer', keys: ['Ctrl', '/'] },
  { action: 'Search conversations', keys: ['Ctrl', 'Shift', 'K'] },
  { action: 'Toggle sidebar', keys: ['Ctrl', 'Alt', 'B'] },
  { action: 'Toggle theme', keys: ['Ctrl', 'Shift', 'L'] },
  { action: 'Send message', keys: ['Enter'] },
  { action: 'New line in message', keys: ['Shift', 'Enter'] },
  { action: 'Navigate to Settings', keys: ['Ctrl', ','] },
  { action: 'Go back', keys: ['Alt', '←'] },
] as const

export function shortcutAction(event: ShortcutEvent): ShortcutAction | null {
  const key = event.key.toLowerCase()
  const mod = event.ctrlKey || event.metaKey

  if (mod && event.altKey && !event.shiftKey && key === 'n') return 'new_chat'
  if (mod && !event.altKey && !event.shiftKey && key === '/') return 'focus_composer'
  if (mod && event.shiftKey && !event.altKey && key === 'k') return 'search_conversations'
  if (mod && event.altKey && !event.shiftKey && key === 'b') return 'toggle_sidebar'
  if (mod && event.shiftKey && !event.altKey && key === 'l') return 'toggle_theme'
  if (mod && !event.altKey && !event.shiftKey && key === ',') return 'open_settings'
  if (!mod && event.altKey && !event.shiftKey && key === 'arrowleft') return 'go_back'
  return null
}
