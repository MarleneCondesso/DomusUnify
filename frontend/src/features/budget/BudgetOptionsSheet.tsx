type Props = {
  onClose: () => void
  onOpenBudgetSettings: () => void
  onOpenNotifications: () => void
  onManageCategories: () => void
  onManageAccounts: () => void
  onChangeBudget: () => void
  onExportData: () => void
  onClearData: () => void
}

type RowProps = {
  icon: string
  label: string
  onPress: () => void
  tone?: 'default' | 'danger'
}

function OptionsRow({ icon, label, onPress, tone = 'default' }: RowProps) {
  const toneClass = tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-charcoal hover:bg-sand-light'

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition ${toneClass}`}
      onClick={onPress}
    >
      <i className={`${icon} text-2xl`} aria-hidden="true" />
      <span className="text-base font-semibold">{label}</span>
    </button>
  )
}

export function BudgetOptionsSheet({
  onClose,
  onOpenBudgetSettings,
  onOpenNotifications,
  onManageCategories,
  onManageAccounts,
  onChangeBudget,
  onExportData,
  onClearData,
}: Props) {
  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 text-center text-xl font-extrabold text-charcoal">Opções</div>

        <div className="space-y-1">
          <OptionsRow icon="ri-settings-3-line" label="Configurações de orçamento" onPress={onOpenBudgetSettings} />
          <OptionsRow icon="ri-notification-3-line" label="Notificações" onPress={onOpenNotifications} />
          <OptionsRow icon="ri-price-tag-3-line" label="Gerenciar categorias" onPress={onManageCategories} />
          <OptionsRow icon="ri-bank-card-line" label="Gerenciar contas" onPress={onManageAccounts} />
          <OptionsRow icon="ri-swap-2-line" label="Mudar orçamento" onPress={onChangeBudget} />
          <OptionsRow icon="ri-upload-2-line" label="Exportar Dados" onPress={onExportData} />
          <OptionsRow icon="ri-delete-bin-6-line" label="Limpar dados" onPress={onClearData} tone="danger" />
        </div>
      </div>
    </div>
  )
}

