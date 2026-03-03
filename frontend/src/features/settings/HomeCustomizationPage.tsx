import { useNavigate } from 'react-router-dom'
import { useAppSettings } from '../../utils/appSettings'

export function HomeCustomizationPage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useAppSettings()

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
          <div className="text-lg font-bold text-charcoal">Personalizar Tela Inicial</div>
          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 space-y-6">
        <div className="text-xs font-bold tracking-wide text-gray-400">OPÇÕES DO SMART CARD</div>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <Row
            icon="ri-smartphone-line"
            title="Mostrar Smart Card"
            subtitle="Exiba o Smart Card na sua tela inicial para atualizações rápidas sobre a atividade da família."
            checked={settings.showSmartCard}
            onChange={(v) => updateSettings({ showSmartCard: v, showTips: v ? settings.showTips : false })}
          />

          <Row
            icon="ri-lightbulb-flash-line"
            title="Mostrar Dicas"
            subtitle="Exibir dentro da Smart Card dicas úteis sobre as funcionalidades do aplicativo."
            checked={settings.showTips}
            disabled={!settings.showSmartCard}
            onChange={(v) => updateSettings({ showTips: v })}
          />
        </section>

        <div className="text-xs font-bold tracking-wide text-gray-400">ORDEM DAS TELHAS</div>
        <section className="rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-sand-light"
            onClick={() => window.alert('Em breve.')}
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark mt-1">
              <i className="ri-layout-grid-line text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-charcoal">Organizar Telhas</div>
              <div className="text-sm text-gray-500">
                Personalize sua tela inicial reordenando as telhas para acessar cada seção.
              </div>
              <div className="mt-3 text-sm font-semibold text-blue-600">Modificar</div>
            </div>
          </button>
        </section>
      </main>
    </div>
  )
}

function Row({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  icon: string
  title: string
  subtitle: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4 min-w-0">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark mt-1">
          <i className={`${icon} text-xl`} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-charcoal">{title}</div>
          <div className="text-sm text-gray-500">{subtitle}</div>
        </div>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-200'
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

