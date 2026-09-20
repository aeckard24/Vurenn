export type ColorThemeId =
  | 'classic' | 'mint' | 'peach' | 'lavender' | 'sky' | 'cream' | 'blush'
  | 'graphite' | 'crimson' | 'royal' | 'forest' | 'ocean' | 'aurora'
  | 'sunset' | 'plum' | 'midnight' | 'sand' | 'steel'

export interface AppearancePreferences {
  color_theme: ColorThemeId
  accent: 'blue' | 'indigo' | 'violet' | 'rose' | 'orange' | 'emerald' | 'cyan' | 'mono'
  gradient: 'solid' | 'ocean' | 'aurora' | 'sunset' | 'berry' | 'midnight'
  atmosphere: 'none' | 'glow' | 'mesh' | 'dusk'
  bubble: 'rounded' | 'soft' | 'compact'
  font_size: 'small' | 'default' | 'large'
}

interface ThemeVariables {
  background: string
  foreground: string
  card: string
  secondary: string
  muted: string
  mutedForeground: string
  border: string
  sidebar: string
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  color_theme: 'classic',
  accent: 'blue',
  gradient: 'solid',
  atmosphere: 'none',
  bubble: 'rounded',
  font_size: 'default',
}

export const ACCENTS = [
  { id: 'blue', label: 'Vurenn blue', color: '#4F7BFF' },
  { id: 'indigo', label: 'Indigo', color: '#6366F1' },
  { id: 'violet', label: 'Violet', color: '#8B5CF6' },
  { id: 'rose', label: 'Rose', color: '#F43F5E' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
  { id: 'emerald', label: 'Emerald', color: '#10B981' },
  { id: 'cyan', label: 'Cyan', color: '#06B6D4' },
  { id: 'mono', label: 'Monochrome', color: '#8B9099' },
] as const

export const GRADIENTS = [
  { id: 'solid', label: 'Solid', background: 'var(--primary)' },
  { id: 'ocean', label: 'Ocean', background: 'linear-gradient(135deg, #2563EB, #06B6D4)' },
  { id: 'aurora', label: 'Aurora', background: 'linear-gradient(135deg, #10B981, #4F7BFF, #8B5CF6)' },
  { id: 'sunset', label: 'Sunset', background: 'linear-gradient(135deg, #F97316, #F43F5E, #8B5CF6)' },
  { id: 'berry', label: 'Berry', background: 'linear-gradient(135deg, #7C3AED, #EC4899)' },
  { id: 'midnight', label: 'Midnight', background: 'linear-gradient(135deg, #0D1321, #2A3A5A, #4F7BFF)' },
] as const

const light = (background: string, card: string, secondary: string, border: string): ThemeVariables => ({
  background, foreground: '#172033', card, secondary, muted: secondary,
  mutedForeground: '#626b7c', border, sidebar: secondary,
})
const dark = (background: string, card: string, secondary: string, border: string): ThemeVariables => ({
  background, foreground: '#f2f5fb', card, secondary, muted: secondary,
  mutedForeground: '#adb6c7', border, sidebar: '#080d18',
})

export const COLOR_THEMES: ReadonlyArray<{
  id: ColorThemeId
  label: string
  preview: string
  variables: ThemeVariables
  darkVariables?: ThemeVariables
}> = [
  { id: 'classic', label: 'Vurenn', preview: 'linear-gradient(135deg,#e9edf2,#a8c5ff)', variables: light('#f6f8fc', '#ffffff', '#edf2f8', '#d7e0ec'), darkVariables: dark('#0d1321', '#131d2e', '#1b2a42', '#2a3a5a') },
  { id: 'mint', label: 'Mint', preview: 'linear-gradient(135deg,#d8f1dd,#9fcbd0)', variables: light('#edf8f1', '#f8fffa', '#dcefe3', '#bad9c7'), darkVariables: dark('#071711', '#0d241a', '#143326', '#285743') },
  { id: 'peach', label: 'Peach', preview: 'linear-gradient(135deg,#ffe39b,#f3b6aa)', variables: light('#fff6e8', '#fffaf2', '#f8e6d0', '#e8cbb2'), darkVariables: dark('#21120b', '#301a11', '#422417', '#68412d') },
  { id: 'lavender', label: 'Lavender', preview: 'linear-gradient(135deg,#c9caeb,#9dbccd)', variables: light('#f1f0fa', '#faf9ff', '#e2e0f1', '#c8c5df'), darkVariables: dark('#141025', '#211a38', '#2e2549', '#4d416d') },
  { id: 'sky', label: 'Sky', preview: 'linear-gradient(135deg,#c9ddff,#c8efe3)', variables: light('#eef6ff', '#f9fcff', '#ddeaf7', '#c2d7ea'), darkVariables: dark('#071725', '#0c2639', '#12354b', '#28546d') },
  { id: 'cream', label: 'Cream', preview: 'linear-gradient(135deg,#f4edce,#fff9e8)', variables: light('#faf7e9', '#fffdf6', '#f0ebd8', '#ded6bc'), darkVariables: dark('#1b1810', '#282319', '#373024', '#554b38') },
  { id: 'blush', label: 'Blush', preview: 'linear-gradient(135deg,#f3ccd2,#e5d7f0)', variables: light('#fcf0f3', '#fff9fb', '#f3e0e6', '#dfc4ce'), darkVariables: dark('#241117', '#351a23', '#482631', '#6a3d4b') },
  { id: 'graphite', label: 'Graphite', preview: 'linear-gradient(135deg,#dfe3ea,#8b9099)', variables: light('#f4f5f7', '#ffffff', '#e8ebef', '#cfd4dc'), darkVariables: dark('#171a20', '#21252e', '#2a303b', '#3b424f') },
  { id: 'crimson', label: 'Crimson', preview: 'linear-gradient(135deg,#ffe8eb,#b71f3b)', variables: light('#fff5f6', '#ffffff', '#fbe6ea', '#efc6ce'), darkVariables: dark('#150708', '#250d10', '#351216', '#5a2028') },
  { id: 'royal', label: 'Royal', preview: 'linear-gradient(135deg,#ecebff,#5550d8)', variables: light('#f6f5ff', '#ffffff', '#e9e7fb', '#d0cdf0'), darkVariables: dark('#11103a', '#1a1850', '#242263', '#3c3981') },
  { id: 'forest', label: 'Forest', preview: 'linear-gradient(135deg,#dff3e8,#25704b)', variables: light('#f1faf5', '#ffffff', '#e0f1e7', '#c2ddcf'), darkVariables: dark('#091810', '#10271b', '#173525', '#2e5541') },
  { id: 'ocean', label: 'Ocean', preview: 'linear-gradient(135deg,#ddf3fa,#287b9b)', variables: light('#f1faff', '#ffffff', '#dff1f7', '#bfdae6'), darkVariables: dark('#081e2b', '#0e3042', '#154154', '#28637a') },
  { id: 'aurora', label: 'Aurora', preview: 'linear-gradient(135deg,#dff8f2,#e6dff8)', variables: light('#f3fbfa', '#ffffff', '#e3f3f1', '#c7dfde'), darkVariables: dark('#101c2b', '#172a3b', '#20394a', '#345d70') },
  { id: 'sunset', label: 'Sunset', preview: 'linear-gradient(135deg,#ffe9d5,#f0dff2)', variables: light('#fff8f2', '#ffffff', '#fae9e1', '#edcec3'), darkVariables: dark('#25101c', '#351728', '#482039', '#69314e') },
  { id: 'plum', label: 'Plum', preview: 'linear-gradient(135deg,#f1e5f2,#9d65a2)', variables: light('#fbf5fc', '#ffffff', '#f0e5f2', '#dbc7df'), darkVariables: dark('#1c1022', '#2b1732', '#3a2142', '#57335f') },
  { id: 'midnight', label: 'Midnight', preview: 'linear-gradient(135deg,#e7eaff,#7181b3)', variables: light('#f5f7ff', '#ffffff', '#e8ecf8', '#cbd3e7'), darkVariables: dark('#080c1d', '#10152b', '#171f39', '#2a3557') },
  { id: 'sand', label: 'Sand', preview: 'linear-gradient(135deg,#f5ebd8,#b89a67)', variables: light('#fbf8f0', '#ffffff', '#f1eadc', '#ddd1b9'), darkVariables: dark('#1a140c', '#292014', '#382b1a', '#59462d') },
  { id: 'steel', label: 'Steel', preview: 'linear-gradient(135deg,#e4eaf2,#8292aa)', variables: light('#f4f7fa', '#ffffff', '#e6ebf1', '#ccd5e0'), darkVariables: dark('#111722', '#1a2331', '#253143', '#3b4b63') },
]

const STORAGE_KEY = 'vurenn-appearance'

export function normalizeAppearance(value: unknown): AppearancePreferences {
  if (!value || typeof value !== 'object') return DEFAULT_APPEARANCE
  const source = value as Partial<AppearancePreferences>
  return {
    color_theme: COLOR_THEMES.some((item) => item.id === source.color_theme) ? source.color_theme! : DEFAULT_APPEARANCE.color_theme,
    accent: ACCENTS.some((item) => item.id === source.accent) ? source.accent! : DEFAULT_APPEARANCE.accent,
    gradient: GRADIENTS.some((item) => item.id === source.gradient) ? source.gradient! : DEFAULT_APPEARANCE.gradient,
    atmosphere: ['none', 'glow', 'mesh', 'dusk'].includes(source.atmosphere ?? '') ? source.atmosphere! : DEFAULT_APPEARANCE.atmosphere,
    bubble: ['rounded', 'soft', 'compact'].includes(source.bubble ?? '') ? source.bubble! : DEFAULT_APPEARANCE.bubble,
    font_size: ['small', 'default', 'large'].includes(source.font_size ?? '') ? source.font_size! : DEFAULT_APPEARANCE.font_size,
  }
}

export function storeAppearance(value: AppearancePreferences): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function clearStoredAppearance(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}

export function loadStoredAppearance(): AppearancePreferences | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? normalizeAppearance(JSON.parse(value)) : null
  } catch {
    return null
  }
}

export function applyAppearance(value: AppearancePreferences): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const accent = ACCENTS.find((item) => item.id === value.accent) ?? ACCENTS[0]
  const gradient = GRADIENTS.find((item) => item.id === value.gradient) ?? GRADIENTS[0]
  const theme = COLOR_THEMES.find((item) => item.id === value.color_theme) ?? COLOR_THEMES[0]
  const palette = root.classList.contains('dark') && theme.darkVariables
    ? theme.darkVariables
    : theme.variables
  const atmospheres: Record<AppearancePreferences['atmosphere'], string> = {
    none: 'none',
    glow: `radial-gradient(circle at 70% 12%, ${accent.color}30, transparent 42%)`,
    mesh: `radial-gradient(circle at 15% 20%, ${accent.color}2e, transparent 35%), radial-gradient(circle at 85% 75%, #A8C5FF24, transparent 40%)`,
    dusk: `linear-gradient(145deg, transparent, ${accent.color}24 52%, transparent)`,
  }
  const bubbleRadius = { rounded: '1rem 1rem .3rem 1rem', soft: '1.35rem 1.35rem .65rem 1.35rem', compact: '.65rem .65rem .2rem .65rem' }[value.bubble]
  const fontScale = { small: '.925', default: '1', large: '1.075' }[value.font_size]

  const variables: Record<string, string> = {
    '--background': palette.background,
    '--foreground': palette.foreground,
    '--card': palette.card,
    '--card-foreground': palette.foreground,
    '--popover': palette.card,
    '--popover-foreground': palette.foreground,
    '--secondary': palette.secondary,
    '--secondary-foreground': palette.foreground,
    '--muted': palette.muted,
    '--muted-foreground': palette.mutedForeground,
    '--accent': palette.secondary,
    '--accent-foreground': palette.foreground,
    '--border': palette.border,
    '--input': palette.border,
    '--sidebar': palette.sidebar,
    '--sidebar-foreground': palette.foreground,
    '--sidebar-accent': palette.secondary,
    '--sidebar-accent-foreground': palette.foreground,
    '--sidebar-border': palette.border,
    '--primary': accent.color,
    '--ring': accent.color,
    '--sidebar-primary': accent.color,
    '--user-message-bg': gradient.background,
    '--chat-atmosphere': atmospheres[value.atmosphere],
    '--user-bubble-radius': bubbleRadius,
    '--chat-font-scale': fontScale,
  }
  Object.entries(variables).forEach(([key, setting]) => root.style.setProperty(key, setting))
  root.dataset.vurennColorTheme = value.color_theme
}
