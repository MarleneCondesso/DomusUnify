import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n'

export function InviteOtherGroupsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>
          <div className="text-lg font-bold text-charcoal">{t('invite.members.option.others.title')}</div>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={t('common.done')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-check-line text-2xl leading-none text-sage-dark" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12">
        <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
            <i className="ri-group-line text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal mb-3">{t('invite.otherGroups.title')}</h1>
          <p className="text-sm text-gray-600">{t('invite.otherGroups.body')}</p>
        </div>
      </main>
    </div>
  )
}
