import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/i18n'

type Props = {
  onClose: () => void
  onOpenBudgetSettings: () => void
  dailyReminderEnabled: boolean
  dailyReminderDisabled?: boolean
  onToggleDailyReminder: () => void
  dailyReminderTime: string
  onEditDailyReminderTime: () => void
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
  right?: ReactNode
}

function OptionsRow({ icon, label, onPress, tone = 'default', right }: RowProps) {
  const toneClass = tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-charcoal hover:bg-sand-light'

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition ${toneClass}`}
      onClick={onPress}
    >
      <i className={`${icon} text-xl text-sage-dark`} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-base">{label}</span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </button>
  )
}

type ToggleRowProps = {
  icon: string
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

function ToggleRow({ icon, label, description, checked, disabled, onToggle }: ToggleRowProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 rounded-2xl p-3 text-left text-charcoal transition hover:bg-sand-light disabled:opacity-60"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
    >
      <i className={`${icon} text-lg text-sage-dark`} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="text-base">{label}</div>
        {description ? <div className="truncate text-xs font-medium text-charcoal/60">{description}</div> : null}
      </div>

      <span
        className={[
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-sage-dark' : 'bg-gray-300',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
            checked ? 'left-5' : 'left-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

export function BudgetOptionsSheet({
  onClose,
  onOpenBudgetSettings,
  dailyReminderEnabled,
  dailyReminderDisabled,
  onToggleDailyReminder,
  dailyReminderTime,
  onEditDailyReminderTime,
  onManageCategories,
  onManageAccounts,
  onChangeBudget,
  onExportData,
  onClearData,
}: Props) {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-80">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 text-center text-xl font-extrabold text-forest">{t('common.options')}</div>

        <div className="space-y-1">
          <OptionsRow icon="ri-settings-3-line" label={t('budget.options.budgetSettings')} onPress={onOpenBudgetSettings} />
          <ToggleRow
            icon="ri-notification-3-line"
            label={t('settings.notifications')}
            description={t('budget.options.notifications.description')}
            checked={dailyReminderEnabled}
            disabled={dailyReminderDisabled}
            onToggle={onToggleDailyReminder}
          />
          <OptionsRow
            icon="ri-time-line"
            label={t('budget.options.reminderTime')}
            onPress={onEditDailyReminderTime}
            right={
              <span className="flex items-center gap-2 text-sm font-extrabold text-sage-dark">
                {dailyReminderTime}
                <i className="ri-arrow-right-s-line text-xl text-sage-dark" aria-hidden="true" />
              </span>
            }
          />
          <OptionsRow icon="ri-price-tag-3-line" label={t('budget.options.manageCategories')} onPress={onManageCategories} />
          <OptionsRow icon="ri-bank-card-line" label={t('budget.options.manageAccounts')} onPress={onManageAccounts} />
          <OptionsRow icon="ri-swap-2-line" label={t('budget.options.switchBudget')} onPress={onChangeBudget} />
          <OptionsRow icon="ri-upload-2-line" label={t('budget.options.exportData')} onPress={onExportData} />
          <OptionsRow icon="ri-delete-bin-6-line" label={t('budget.options.clearData')} onPress={onClearData} tone="danger" />
        </div>
      </div>
    </div>
  )
}
