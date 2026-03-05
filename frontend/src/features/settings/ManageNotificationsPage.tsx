import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n'
import type { MessageKey } from '../../i18n/messages'
import { type NotificationCategoryId, useAppSettings } from '../../utils/appSettings'

const EVENT_CATEGORIES = [
  { id: 'note', labelKey: 'notifications.category.note', icon: 'ri-sticky-note-line' },
  { id: 'messages', labelKey: 'notifications.category.messages', icon: 'ri-chat-3-line' },
  { id: 'shared-location', labelKey: 'notifications.category.shared-location', icon: 'ri-map-pin-line' },
  { id: 'photos-videos', labelKey: 'notifications.category.photos-videos', icon: 'ri-image-line' },
  { id: 'calendar', labelKey: 'notifications.category.calendar', icon: 'ri-calendar-line' },
  { id: 'birthdays', labelKey: 'notifications.category.birthdays', icon: 'ri-cake-2-line' },
  { id: 'lists', labelKey: 'notifications.category.lists', icon: 'ri-file-list-3-line' },
  { id: 'schedule', labelKey: 'notifications.category.schedule', icon: 'ri-time-line' },
  { id: 'budget', labelKey: 'notifications.category.budget', icon: 'ri-piggy-bank-line' },
  { id: 'documents', labelKey: 'notifications.category.documents', icon: 'ri-folder-3-line' },
] as const satisfies Array<{ id: NotificationCategoryId; labelKey: MessageKey; icon: string }>

const OTHER_CATEGORIES = [
  { id: 'comments', labelKey: 'notifications.category.comments', icon: 'ri-chat-1-line' },
  { id: 'likes', labelKey: 'notifications.category.likes', icon: 'ri-heart-line' },
] as const satisfies Array<{ id: NotificationCategoryId; labelKey: MessageKey; icon: string }>

export function ManageNotificationsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useAppSettings()
  const { t } = useI18n()

  const setCategory = (id: NotificationCategoryId, enabled: boolean) => {
    updateSettings({
      notificationCategories: {
        ...settings.notificationCategories,
        [id]: enabled,
      },
    })
  }

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-white bg-offwhite shadow-md py-3.5"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>
          <div className="text-lg font-bold text-charcoal">{t('settings.manageNotifications')}</div>
          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 space-y-6">
        {!settings.notificationsEnabled ? (
          <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber-dark">
            {t('manageNotifications.disabledHint')}
          </div>
        ) : null}

        <div className="text-xs font-bold tracking-wide text-gray-400">{t('manageNotifications.section.events')}</div>
        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {EVENT_CATEGORIES.map((c) => (
            <Row
              key={c.id}
              icon={c.icon}
              label={t(c.labelKey)}
              checked={settings.notificationCategories[c.id]}
              disabled={!settings.notificationsEnabled}
              onChange={(v) => setCategory(c.id, v)}
            />
          ))}
        </section>

        <div className="text-xs font-bold tracking-wide text-gray-400">{t('manageNotifications.section.other')}</div>
        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {OTHER_CATEGORIES.map((c) => (
            <Row
              key={c.id}
              icon={c.icon}
              label={t(c.labelKey)}
              checked={settings.notificationCategories[c.id]}
              disabled={!settings.notificationsEnabled}
              onChange={(v) => setCategory(c.id, v)}
            />
          ))}
        </section>
      </main>
    </div>
  )
}

function Row({
  icon,
  label,
  checked,
  onChange,
  disabled,
}: {
  icon: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
          <i className={`${icon} text-xl`} />
        </div>
        <div className="text-base font-semibold text-charcoal">{label}</div>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-gray-200'
        }`}
        onClick={() => {
          if (disabled) return
          onChange(!checked)
        }}
        aria-label={checked ? t('common.enabled') : t('common.disabled')}
      >
        <span
          className={`inline-block h-8 w-8 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
