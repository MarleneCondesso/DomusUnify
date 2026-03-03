import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

export type NotificationCategoryId =
  | 'note'
  | 'messages'
  | 'shared-location'
  | 'photos-videos'
  | 'calendar'
  | 'birthdays'
  | 'lists'
  | 'schedule'
  | 'budget'
  | 'documents'
  | 'comments'
  | 'likes'

export type AppSettings = {
  themeMode: ThemeMode
  notificationsEnabled: boolean
  notificationCategories: Record<NotificationCategoryId, boolean>
  showSmartCard: boolean
  showTips: boolean
}

const STORAGE_KEY = 'domus.appSettings.v1'

const DEFAULT_NOTIFICATION_CATEGORIES: Record<NotificationCategoryId, boolean> = {
  note: true,
  messages: true,
  'shared-location': true,
  'photos-videos': true,
  calendar: true,
  birthdays: true,
  lists: true,
  schedule: true,
  budget: true,
  documents: true,
  comments: true,
  likes: true,
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  notificationsEnabled: true,
  notificationCategories: DEFAULT_NOTIFICATION_CATEGORIES,
  showSmartCard: true,
  showTips: true,
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings> | null
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS

    const themeMode = isThemeMode(parsed.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode
    const notificationsEnabled =
      typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled
    const showSmartCard = typeof parsed.showSmartCard === 'boolean' ? parsed.showSmartCard : DEFAULT_SETTINGS.showSmartCard
    const showTips = typeof parsed.showTips === 'boolean' ? parsed.showTips : DEFAULT_SETTINGS.showTips

    const notificationCategories = { ...DEFAULT_NOTIFICATION_CATEGORIES }
    if (parsed.notificationCategories && typeof parsed.notificationCategories === 'object') {
      for (const k of Object.keys(notificationCategories) as NotificationCategoryId[]) {
        const v = (parsed.notificationCategories as Record<string, unknown>)[k]
        if (typeof v === 'boolean') notificationCategories[k] = v
      }
    }

    return {
      themeMode,
      notificationsEnabled,
      notificationCategories,
      showSmartCard,
      showTips,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeStoredSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
}

type AppSettingsContextValue = {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => readStoredSettings())

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    writeStoredSettings(settings)
  }, [settings])

  useEffect(() => {
    if (settings.themeMode === 'system') {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      if (!mql) {
        applyTheme('light')
        return
      }

      const sync = () => applyTheme(mql.matches ? 'dark' : 'light')
      sync()
      mql.addEventListener('change', sync)
      return () => mql.removeEventListener('change', sync)
    }

    applyTheme(settings.themeMode)
  }, [settings.themeMode])

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings])
  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider')
  return ctx
}

