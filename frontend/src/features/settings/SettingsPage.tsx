import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FamilyResponse } from '../../api/domusApi'
import { useAppSettings } from '../../utils/appSettings'

type Props = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

export function SettingsPage({ onLogout }: Props) {
  const navigate = useNavigate()
  const { settings, updateSettings } = useAppSettings()

  const shareApp = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/`
    const text = 'Experimenta o DomusUnify — um assistente familiar para organizar listas, calendário e orçamento.'

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
      window.alert('Link copiado.')
    } catch {
      window.alert(url)
    }
  }

  const notificationsLabel = useMemo(
    () => (settings.notificationsEnabled ? 'Ativado' : 'Desativado'),
    [settings.notificationsEnabled],
  )

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Home"
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">Configurações</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Sair"
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
            label="Gerenciar grupos"
            onClick={() => navigate('/settings/groups')}
          />

          <SettingsRow
            icon="ri-vip-crown-2-line"
            label="Assinatura Premium"
            onClick={() => window.alert('Em breve.')}
          />

          <SettingsRow
            icon="ri-notification-3-line"
            label="Notificações"
            right={
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(v) => updateSettings({ notificationsEnabled: v })}
              />
            }
            subtitle={notificationsLabel}
          />

          <SettingsRow
            icon="ri-settings-3-line"
            label="Gerenciar notificações"
            onClick={() => navigate('/settings/notifications')}
          />
        </section>

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow icon="ri-moon-line" label="Modo Escuro" onClick={() => navigate('/settings/dark-mode')} />
          <SettingsRow
            icon="ri-smartphone-line"
            label="Personalizar Tela Inicial"
            onClick={() => navigate('/settings/home')}
          />
          <SettingsRow icon="ri-translate-2" label="Língua" onClick={() => window.alert('Em breve.')} />
        </section>

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow icon="ri-question-line" label="Ajuda" onClick={() => window.alert('Em breve.')} />
          <SettingsRow
            icon="ri-mail-line"
            label="Contate-nos"
            onClick={() => {
              window.location.href = 'mailto:support@domusunify.app?subject=DomusUnify%20-%20Suporte'
            }}
          />
          <SettingsRow icon="ri-information-line" label="Ver o tutorial" onClick={() => window.alert('Em breve.')} />
        </section>

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <SettingsRow icon="ri-heart-line" label="Taxa na App Store" onClick={() => window.alert('Em breve.')} />
          <SettingsRow icon="ri-share-line" label="Recomendar a um amigo" onClick={() => void shareApp()} />
          <SettingsRow icon="ri-information-2-line" label="Sobre nós" onClick={() => window.alert('Em breve.')} />
        </section>

        <button
          type="button"
          className="mt-10 w-full rounded-2xl bg-white px-5 py-4 text-center text-red-600 font-semibold shadow-sm hover:bg-red-50"
          onClick={onLogout}
        >
          Sair
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      aria-label={checked ? 'Ativado' : 'Desativado'}
    >
      <span
        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
