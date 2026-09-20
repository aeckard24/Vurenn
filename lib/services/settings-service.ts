export type Theme = 'light' | 'dark'

export interface AppSettings {
  schemaVersion: 1
  theme: Theme
  selectedModelId: string
}

export type SettingsPatch = Partial<Omit<AppSettings, 'schemaVersion'>>

export const DEFAULT_APP_SETTINGS: AppSettings = {
  schemaVersion: 1,
  theme: 'dark',
  selectedModelId: 'vurenn',
}

export interface LegacySettingsSnapshot {
  settings?: unknown
  theme?: unknown
  selectedModelId?: unknown
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Converts old individual localStorage values into the versioned settings
 * payload Andrew's backend can accept later.
 */
export function migrateSettingsSnapshot(
  snapshot: LegacySettingsSnapshot,
): AppSettings {
  if (
    snapshot.settings &&
    typeof snapshot.settings === 'object' &&
    (snapshot.settings as Partial<AppSettings>).schemaVersion === 1
  ) {
    const current = snapshot.settings as Partial<AppSettings>
    return {
      schemaVersion: 1,
      theme: isTheme(current.theme)
        ? current.theme
        : DEFAULT_APP_SETTINGS.theme,
      selectedModelId:
        typeof current.selectedModelId === 'string' &&
        current.selectedModelId.trim()
          ? current.selectedModelId
          : DEFAULT_APP_SETTINGS.selectedModelId,
    }
  }

  return {
    schemaVersion: 1,
    theme: isTheme(snapshot.theme)
      ? snapshot.theme
      : DEFAULT_APP_SETTINGS.theme,
    selectedModelId:
      typeof snapshot.selectedModelId === 'string' &&
      snapshot.selectedModelId.trim()
        ? snapshot.selectedModelId
        : DEFAULT_APP_SETTINGS.selectedModelId,
  }
}

export interface SettingsService {
  getSettings(): Promise<AppSettings>
  updateSettings(patch: SettingsPatch): Promise<AppSettings>
  resetSettings(): Promise<AppSettings>
  getMigrationPayload(): AppSettings
}
