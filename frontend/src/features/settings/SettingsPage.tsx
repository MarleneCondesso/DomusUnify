import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FamilyResponse } from '../../api/domusApi'
import { useI18n } from '../../i18n/i18n'
import { useAppSettings } from '../../utils/appSettings'
import { syncWebPushSubscription } from '../../utils/webPush'

type Props = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

export function SettingsPage({ token, onLogout }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { settings, updateSettings } = useAppSettings()
  const [pushBusy, setPushBusy] = useState(false)

  const shareApp = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/`
    const text = t('settings.shareAppText')

    try {
      if (navigator.share) {
        await navigator.share({ title: 'DomusUnify', text, url })
        return
      }
    } catch {
      // ignore
    }

    try {
      await navigator.clipboard.writeText(url)
      window.alert(t('common.linkCopied'))
    } catch {
      window.alert(url)
    }
  }

  const notificationsLabel = useMemo(
    () => (
      pushBusy
        ? t('common.loading')
        : settings.notificationsEnabled
          ? t('settings.notifications.enabled')
          : t('settings.notifications.disabled')
    ),
    [pushBusy, settings.notificationsEnabled, t],
  )

  const handleNotificationsToggle = async (nextValue: boolean) => {
    if (pushBusy) return

    if (!nextValue) {
      updateSettings({ notificationsEnabled: false })
      return
    }

    setPushBusy(true)
    try {
      const result = await syncWebPushSubscription(token, { ...settings, notificationsEnabled: true }, { requestPermission: true })
      if (result === 'enabled') {
        updateSettings({ notificationsEnabled: true })
        return
      }

      const message =
        result === 'unsupported'
          ? t('settings.notifications.pushUnsupported')
          : result === 'permission-denied'
            ? t('settings.notifications.permissionDenied')
            : t('settings.notifications.syncError')

      window.alert(message)
    } catch {
      window.alert(t('settings.notifications.syncError'))
    } finally {
      setPushBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
            aria-label={t('common.home')}
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-forest">{t('settings.title')}</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
            aria-label={t('common.logout')}
            onClick={onLogout}
          >
            <i className="ri-logout-box-r-line text-2xl leading-none text-red-500" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow
            icon="ri-group-line"
            label={t('settings.manageGroups')}
            onClick={() => navigate('/settings/groups')}
          />

          <SettingsRow
            icon="ri-notification-3-line"
            label={t('settings.notifications')}
            right={
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(v) => void handleNotificationsToggle(v)}
                ariaLabel={notificationsLabel}
                disabled={pushBusy}
              />
            }
            subtitle={notificationsLabel}
          />

          <SettingsRow
            icon="ri-settings-3-line"
            label={t('settings.manageNotifications')}
            onClick={() => navigate('/settings/notifications')}
          />
        </section>

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow icon="ri-moon-line" label={t('settings.darkMode')} onClick={() => navigate('/settings/dark-mode')} />
          <SettingsRow icon="ri-translate-2" label={t('settings.language.title')} onClick={() => navigate('/settings/language')} />
        </section>

        <div className="h-6" />

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow icon="ri-share-line" label={t('settings.recommendFriend')} onClick={() => void shareApp()} />
          <SettingsRow icon="ri-information-2-line" label={t('settings.aboutUs')} onClick={() => window.alert(t('common.comingSoon'))} />
        </section>

        <button
          type="button"
          className="mt-10 w-full rounded-2xl bg-white px-5 py-4 text-center text-red-600 font-semibold shadow-sm hover:bg-red-50"
          onClick={onLogout}
        >
          {t('common.logout')}
        </button>
      </main>
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onClick,
  right,
}: {
  icon: string
  label: string
  subtitle?: string
  onClick?: () => void
  right?: ReactNode
}) {
  const isButton = Boolean(onClick)
  const Comp = isButton ? 'button' : 'div'
  return (
    <Comp
      {...(isButton
        ? { type: 'button', onClick }
        : {})}
      className={`w-full px-5 py-4 flex items-center gap-4 text-left ${isButton ? 'hover:bg-sand-light' : ''}`}
    >
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
        <i className={`${icon} text-xl`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-charcoal">{label}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      {right ? (
        <div className="shrink-0">{right}</div>
      ) : isButton ? (
        <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
      ) : null}
    </Comp>
  )
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onChange(!checked)
      }}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <span
        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
