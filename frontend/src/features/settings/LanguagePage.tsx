import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n, type LanguageMode } from '../../i18n/i18n'

export function LanguagePage() {
  const navigate = useNavigate()
  const { t, languageMode, setLanguageMode, language } = useI18n()

  const options = useMemo(
    () =>
      [
        { id: 'system' as const, label: t('settings.language.system') },
        { id: 'en' as const, label: t('settings.language.english') },
        { id: 'pt' as const, label: t('settings.language.portuguese') },
      ] satisfies Array<{ id: LanguageMode; label: string }>,
    [t],
  )

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-forest">{t('settings.language.title')}</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-4 rounded-2xl bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
          {languageMode === 'system'
            ? t('settings.language.system')
            : `${t('settings.language.title')}: ${language.toUpperCase()}`}
        </div>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {options.map((opt) => {
            const isSelected = opt.id === languageMode
            return (
              <button
                key={opt.id}
                type="button"
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light"
                onClick={() => setLanguageMode(opt.id)}
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
                  <i className="ri-translate-2 text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-charcoal">{opt.label}</div>
                </div>
                {isSelected ? (
                  <i className="ri-check-line text-2xl leading-none text-forest" aria-hidden="true" />
                ) : (
                  <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </section>
      </main>
    </div>
  )
}
