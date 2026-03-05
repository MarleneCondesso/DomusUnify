import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { messagesByLanguage, type Language, type MessageKey } from './messages'
import { useAppSettings } from '../utils/appSettings'

export type LanguageMode = 'system' | Language

type I18nContextValue = {
  language: Language
  languageMode: LanguageMode
  setLanguageMode: (mode: LanguageMode) => void
  locale: string
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useAppSettings()

  const languageMode = (settings.languageMode ?? 'system') as LanguageMode
  const systemLanguage = detectSystemLanguage()
  const language: Language = languageMode === 'system' ? systemLanguage : languageMode
  const locale = localeForLanguage(language)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguageMode = useCallback(
    (mode: LanguageMode) => {
      updateSettings({ languageMode: mode })
    },
    [updateSettings],
  )

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const table = messagesByLanguage[language] ?? messagesByLanguage.en
      const raw = table[key] ?? messagesByLanguage.en[key] ?? key
      return formatMessage(raw, vars)
    },
    [language],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ language, languageMode, setLanguageMode, locale, t }),
    [language, languageMode, locale, setLanguageMode, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

function formatMessage(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v))
  }
  return out
}

function normalizeLanguageTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function detectSystemLanguage(): Language {
  const candidates: string[] = []

  try {
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages)
    if (typeof navigator.language === 'string') candidates.push(navigator.language)
  } catch {
    // ignore
  }

  for (const c of candidates) {
    const tag = normalizeLanguageTag(c)
    if (!tag) continue

    if (tag.startsWith('pt')) return 'pt'
    if (tag.startsWith('zh')) return 'zh'
    if (tag.startsWith('en')) return 'en'
  }

  return 'en'
}

function localeForLanguage(language: Language): string {
  if (language === 'pt') return 'pt-PT'
  if (language === 'zh') return 'zh-CN'
  return 'en'
}
