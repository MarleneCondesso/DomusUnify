import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSettings } from '../../utils/appSettings'

export function DarkModePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useAppSettings()

  const isSystem = settings.themeMode === 'system'
  const systemPrefersDark = useMemo(() => window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false, [])
  const isDark = isSystem ? systemPrefersDark : settings.themeMode === 'dark'

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>
          <div className="text-lg font-bold text-charcoal">Modo Escuro</div>
          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <section
          className={`rounded-3xl overflow-hidden shadow-sm ${
            isDark ? 'bg-linear-to-b from-[#22124b] to-[#0b0f0d]' : 'bg-linear-to-b from-blue-500 to-blue-400'
          }`}
        >
          <div className="px-6 py-10 flex flex-col items-center">
            <SunMoon isDark={isDark} />
            <div className="mt-6 text-white/90 text-sm font-semibold">
              {isSystem ? 'A seguir o tema do dispositivo.' : isDark ? 'Modo escuro ativado.' : 'Modo claro ativado.'}
            </div>
          </div>

          <div className={`px-6 py-6 ${isDark ? 'bg-black/35' : 'bg-white/80'}`}>
            <div className="space-y-5">
              <Row
                title="Modo Escuro"
                subtitle="Ativa o tema escuro"
                disabled={isSystem}
                checked={!isSystem && settings.themeMode === 'dark'}
                onChange={(v) => updateSettings({ themeMode: v ? 'dark' : 'light' })}
              />

              <Row
                title="Utilizar configurações do dispositivo"
                subtitle="Define o tema com base nas configurações do sistema"
                checked={isSystem}
                onChange={(v) => updateSettings({ themeMode: v ? 'system' : isDark ? 'dark' : 'light' })}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SunMoon({ isDark }: { isDark: boolean }) {
  return (
    <div className="relative h-40 w-40">
      <div
        className={`absolute inset-0 grid place-items-center transition-all duration-500 ${
          isDark ? 'opacity-0 scale-75 rotate-[-12deg]' : 'opacity-100 scale-100 rotate-0'
        }`}
      >
        <div className="relative">
          <i className="ri-sun-fill text-[96px] leading-none text-yellow-300 drop-shadow-[0_10px_35px_rgba(250,204,21,0.45)]" />
          <div className="absolute inset-0 -z-10 blur-2xl opacity-60 bg-yellow-200 rounded-full" />
        </div>
      </div>

      <div
        className={`absolute inset-0 grid place-items-center transition-all duration-500 ${
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-[12deg]'
        }`}
      >
        <div className="relative">
          <i className="ri-moon-fill text-[96px] leading-none text-indigo-200 drop-shadow-[0_10px_35px_rgba(199,210,254,0.35)]" />
          <div className="absolute -top-2 -right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur">
            <i className="ri-star-smile-fill text-xl text-white/80" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  title,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  title: string
  subtitle: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <div className="text-base font-bold text-charcoal">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
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
        aria-label={checked ? 'Ativado' : 'Desativado'}
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

