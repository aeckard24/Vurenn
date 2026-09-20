import type {
  AppSettings,
  SettingsPatch,
  SettingsService,
} from '@/lib/services/settings-service'
import {
  DEFAULT_APP_SETTINGS,
  migrateSettingsSnapshot,
} from '@/lib/services/settings-service'
import { STORAGE_KEYS, storage } from '@/lib/utils/storage'

function migrateLocalSettings(): AppSettings {
  const stored = storage.get<AppSettings | null>(STORAGE_KEYS.settings, null)
  const migrated = migrateSettingsSnapshot({
    settings: stored,
    theme: storage.get(STORAGE_KEYS.theme, DEFAULT_APP_SETTINGS.theme),
    selectedModelId: storage.get(
      STORAGE_KEYS.model,
      DEFAULT_APP_SETTINGS.selectedModelId,
    ),
  })
  storage.set(STORAGE_KEYS.settings, migrated)
  return migrated
}

export class MockSettingsService implements SettingsService {
  async getSettings(): Promise<AppSettings> {
    return migrateLocalSettings()
  }

  async updateSettings(patch: SettingsPatch): Promise<AppSettings> {
    const updated = { ...migrateLocalSettings(), ...patch, schemaVersion: 1 as const }
    storage.set(STORAGE_KEYS.settings, updated)
    if (patch.theme) storage.set(STORAGE_KEYS.theme, patch.theme)
    if (patch.selectedModelId) {
      storage.set(STORAGE_KEYS.model, patch.selectedModelId)
    }
    return updated
  }

  async resetSettings(): Promise<AppSettings> {
    storage.set(STORAGE_KEYS.settings, DEFAULT_APP_SETTINGS)
    storage.set(STORAGE_KEYS.theme, DEFAULT_APP_SETTINGS.theme)
    storage.set(STORAGE_KEYS.model, DEFAULT_APP_SETTINGS.selectedModelId)
    return DEFAULT_APP_SETTINGS
  }

  getMigrationPayload(): AppSettings {
    return migrateLocalSettings()
  }
}

export const mockSettingsService = new MockSettingsService()
