import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateBudgetRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { BottomSheetPicker, type BottomSheetOption } from '../../ui/BottomSheetPicker'
import { encodeEmojiToIconKey } from '../../utils/emojiIconKey'
import { formatCurrency } from '../../utils/intl'

type Props = {
  token: string
  defaultCurrencyCode: string
  onClose: () => void
  onCreated: (budgetId: string) => void
}

type PickerId = null | 'periodType' | 'startDay' | 'currency' | 'visibility' | 'indicator' | 'order' | 'upcoming'

const PERIOD_OPTION_KEYS = [
  { id: 'Monthly', labelKey: 'budget.period.monthly' },
  { id: 'Weekly', labelKey: 'budget.period.weekly' },
  { id: 'BiWeekly', labelKey: 'budget.period.biWeekly' },
  { id: 'SemiMonthly', labelKey: 'budget.period.semiMonthly' },
  { id: 'Yearly', labelKey: 'budget.period.yearly' },
] as const

const CURRENCY_OPTIONS: BottomSheetOption[] = [
  { id: 'EUR', label: 'EUR' },
  { id: 'USD', label: 'USD' },
  { id: 'GBP', label: 'GBP' },
  { id: 'BRL', label: 'BRL' },
]

const VISIBILITY_OPTION_KEYS = [
  { id: 'AllMembers', labelKey: 'budget.visibility.allMembers' },
  { id: 'Private', labelKey: 'budget.visibility.private' },
] as const

const INDICATOR_OPTION_KEYS = [
  { id: 'Balance', labelKey: 'budget.indicator.balanceMonth' },
  { id: 'BalanceToday', labelKey: 'budget.indicator.balanceToday' },
  { id: 'TotalExpenses', labelKey: 'budget.indicator.totalExpenses' },
  { id: 'TotalIncome', labelKey: 'budget.indicator.totalIncome' },
] as const

const ORDER_OPTION_KEYS = [
  { id: 'MostRecentFirst', labelKey: 'budget.order.mostRecentFirst' },
  { id: 'OldestFirst', labelKey: 'budget.order.oldestFirst' },
] as const

const UPCOMING_OPTION_KEYS = [
  { id: 'Expanded', labelKey: 'budget.upcoming.expanded' },
  { id: 'Collapsed', labelKey: 'budget.upcoming.collapsed' },
] as const

type RowProps = {
  icon: string
  label: string
  value: string
  valueTone?: 'default' | 'accent'
  onPress?: () => void
}

function SettingsRow({ icon, label, value, valueTone = 'default', onPress }: RowProps) {
  const interactive = Boolean(onPress)
  const valueClass = valueTone === 'accent' ? 'text-sage-dark' : 'text-charcoal/60'

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left ${interactive ? 'hover:bg-sand-light' : ''}`}
      onClick={onPress}
      disabled={!interactive}
    >
      <div className="flex min-w-0 items-center gap-4">
        <i className={`${icon} text-2xl text-sage-dark`} aria-hidden="true" />
        <div className="truncate text-base font-semibold text-charcoal">{label}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
        {interactive ? <i className="ri-arrow-right-s-line text-2xl text-sage-dark" aria-hidden="true" /> : null}
      </div>
    </button>
  )
}

function SpendingLimitSheet({
  currencyCode,
  value,
  onClose,
  onSave,
}: {
  currencyCode: string
  value: number | null
  onClose: () => void
  onSave: (value: number | null) => void
}) {
  const { t } = useI18n()
  const [raw, setRaw] = useState(() => (value === null || value === undefined ? '' : String(value)))

  const parsed = useMemo(() => {
    const normalized = raw.trim().replace(',', '.')
    if (!normalized) return null
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
  }, [raw])

  return (
    <div className="fixed inset-0 z-90">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-forest">{t('budget.spendingLimit.title')}</div>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-white bg-white/60"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <i className="ri-close-line text-xl text-sage-dark" />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-forest">
            {t('budget.spendingLimit.valueLabel', { currency: currencyCode.toUpperCase() })}
          </label>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="decimal"
            placeholder={t('budget.spendingLimit.placeholder')}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-sage-dark"
          />
          <div className="mt-3 text-xs text-charcoal/60">{t('budget.spendingLimit.hint')}</div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-charcoal hover:bg-sand-light"
            onClick={() => {
              onSave(null)
              onClose()
            }}
          >
            {t('budget.spendingLimit.noLimit')}
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-sage-dark px-4 py-3 text-sm font-semibold text-white hover:bg-forest disabled:opacity-50"
            disabled={raw.trim() !== '' && parsed === null}
            onClick={() => {
              onSave(parsed)
              onClose()
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CreateBudgetSheet({ token, defaultCurrencyCode, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)
  const { t, locale } = useI18n()

  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [picker, setPicker] = useState<PickerId>(null)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💰')

  const [periodType, setPeriodType] = useState('Monthly')
  const [startDay, setStartDay] = useState(1)
  const [spendingLimit, setSpendingLimit] = useState<number | null>(null)
  const [currencyCode, setCurrencyCode] = useState((defaultCurrencyCode || 'EUR').toUpperCase())
  const [visibilityMode, setVisibilityMode] = useState('AllMembers')
  const [mainIndicator, setMainIndicator] = useState('Balance')
  const [onlyPaidInTotals, setOnlyPaidInTotals] = useState(false)
  const [transactionOrder, setTransactionOrder] = useState('MostRecentFirst')
  const [upcomingDisplayMode, setUpcomingDisplayMode] = useState('Expanded')
  const [spendingLimitOpen, setSpendingLimitOpen] = useState(false)

  const startDate = useMemo(() => {
    const parts = todayUtc.split('-')
    if (parts.length !== 3) return todayUtc
    const [y, m] = parts
    const safeDay = Math.min(28, Math.max(1, Number.isFinite(startDay) ? startDay : 1))
    return `${y}-${m}-${String(safeDay).padStart(2, '0')}`
  }, [startDay, todayUtc])

  const periodOptions: BottomSheetOption[] = useMemo(
    () => PERIOD_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) })),
    [t],
  )

  const visibilityOptions: BottomSheetOption[] = useMemo(
    () => VISIBILITY_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) })),
    [t],
  )

  const indicatorOptions: BottomSheetOption[] = useMemo(
    () => INDICATOR_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) })),
    [t],
  )

  const orderOptions: BottomSheetOption[] = useMemo(
    () => ORDER_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) })),
    [t],
  )

  const upcomingOptions: BottomSheetOption[] = useMemo(
    () => UPCOMING_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) })),
    [t],
  )

  const startDayOptions: BottomSheetOption[] = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ id: String(i + 1), label: t('budget.create.dayOption', { day: i + 1 }) })),
    [t],
  )

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const createMutation = useMutation({
    mutationFn: (req: CreateBudgetRequest) => domusApi.createBudget(token, req),
    onSuccess: async (budget) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      const id = budget.id
      if (id) onCreated(id)
    },
  })

  const errorMessage = useMemo(() => {
    const err = createMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [createMutation.error])

  const canSave = Boolean(name.trim()) && !createMutation.isPending

  const spendingLimitLabel =
    spendingLimit === null || spendingLimit === undefined
      ? t('budget.create.spendingLimit.configure')
      : formatCurrency(Math.abs(spendingLimit), currencyCode, locale)
  const spendingLimitTone: RowProps['valueTone'] =
    spendingLimit === null || spendingLimit === undefined ? 'accent' : 'default'

  const visibilityLabel = visibilityOptions.find((x) => x.id === visibilityMode)?.label ?? '—'
  const indicatorLabel = indicatorOptions.find((x) => x.id === mainIndicator)?.label ?? '—'
  const orderLabel = orderOptions.find((x) => x.id === transactionOrder)?.label ?? '—'
  const upcomingLabel = upcomingOptions.find((x) => x.id === upcomingDisplayMode)?.label ?? '—'

  const periodLabel = periodOptions.find((o) => o.id === periodType)?.label ?? '—'
  const periodValue =
    periodType === 'Monthly'
      ? `${periodLabel} | ${t('budget.create.dayValue', { day: Number.isFinite(startDay) ? startDay : 1 })}`
      : periodLabel

  const submit = () => {
    if (!canSave) return
    const trimmedName = name.trim()
    const iconKey = encodeEmojiToIconKey(emoji) ?? null

    const req: CreateBudgetRequest = {
      name: trimmedName,
      iconKey,
      type: 'Recurring',
      periodType,
      startDate,
      spendingLimit,
      currencyCode,
      visibilityMode,
      mainIndicator,
      onlyPaidInTotals,
      transactionOrder,
      upcomingDisplayMode,
    }

    createMutation.mutate(req)
  }

  return (
    <div className="fixed inset-0 z-80">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onClose}
              disabled={createMutation.isPending}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl text-sage-dark" />
            </button>

            <div className="text-base font-semibold text-charcoal">{t('budget.create.title')}</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label={t('common.save')}
              title={t('common.save')}
            >
              <i
                className={
                  createMutation.isPending
                    ? 'ri-loader-4-line animate-spin text-2xl text-sage-dark'
                    : 'ri-check-line text-2xl text-sage-dark'
                }
              />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <div className="flex items-center gap-4 px-4 py-4">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="h-12 w-12 shrink-0 rounded-2xl border border-gray-200 bg-sand-light text-center text-2xl outline-none focus:ring-2 focus:ring-sage-dark/25"
                disabled={createMutation.isPending}
                aria-label={t('common.icon')}
              />
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('budget.create.namePlaceholder')}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base font-semibold text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                disabled={createMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  submit()
                }}
              />
            </div>

            <SettingsRow
              icon="ri-calendar-event-line"
              label={t('budget.create.period.label')}
              value={periodValue}
              onPress={() => setPicker('periodType')}
            />

            {periodType === 'Monthly' ? (
              <SettingsRow
                icon="ri-calendar-check-line"
                label={t('budget.create.startDay.label')}
                value={t('budget.create.dayValue', { day: startDay })}
                onPress={() => setPicker('startDay')}
              />
            ) : null}

            <SettingsRow
              icon="ri-focus-3-line"
              label={t('budget.create.spendingLimit.label')}
              value={spendingLimitLabel}
              valueTone={spendingLimitTone}
              onPress={() => setSpendingLimitOpen(true)}
            />

            <SettingsRow
              icon="ri-user-settings-line"
              label={t('budget.create.visibility.label')}
              value={visibilityLabel}
              valueTone="accent"
              onPress={() => setPicker('visibility')}
            />
          </div>

          <div className="mt-5 text-xs font-semibold tracking-wider text-forest uppercase">{t('budget.create.displaySettings')}</div>

          <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <SettingsRow
              icon="ri-money-euro-circle-line"
              label={t('budget.create.currency.label')}
              value={currencyCode.toUpperCase()}
              onPress={() => setPicker('currency')}
            />

            <SettingsRow
              icon="ri-bar-chart-2-line"
              label={t('budget.create.indicators.label')}
              value={indicatorLabel}
              onPress={() => setPicker('indicator')}
            />

            <SettingsRow
              icon="ri-sort-desc"
              label={t('budget.create.order.label')}
              value={orderLabel}
              onPress={() => setPicker('order')}
            />

            <SettingsRow
              icon="ri-time-line"
              label={t('budget.create.upcoming.label')}
              value={upcomingLabel}
              onPress={() => setPicker('upcoming')}
            />

            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <i className="ri-checkbox-circle-line text-2xl text-sage-dark" aria-hidden="true" />
                <div className="truncate text-base font-semibold text-charcoal">{t('budget.create.onlyPaidInTotals')}</div>
              </div>
              <button
                type="button"
                className={`relative h-7 w-12 rounded-full transition ${onlyPaidInTotals ? 'bg-sage-dark' : 'bg-gray-200'}`}
                onClick={() => setOnlyPaidInTotals((v) => !v)}
                disabled={createMutation.isPending}
                aria-label={t('budget.create.onlyPaidInTotals')}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${onlyPaidInTotals ? 'left-6' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {picker === 'periodType' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.period.label')}
          options={periodOptions}
          selectedId={periodType}
          onSelect={(id) => setPeriodType(id ?? 'Monthly')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'startDay' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.startDay.label')}
          options={startDayOptions}
          selectedId={String(startDay)}
          onSelect={(id) => {
            const parsed = id ? Number.parseInt(id, 10) : 1
            setStartDay(Number.isFinite(parsed) ? parsed : 1)
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'currency' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.currency.label')}
          options={CURRENCY_OPTIONS}
          selectedId={currencyCode}
          onSelect={(id) => setCurrencyCode((id ?? 'EUR').toUpperCase())}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'visibility' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.visibility.label')}
          options={visibilityOptions}
          selectedId={visibilityMode}
          onSelect={(id) => setVisibilityMode(id ?? 'AllMembers')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'indicator' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.indicators.label')}
          options={indicatorOptions}
          selectedId={mainIndicator}
          onSelect={(id) => setMainIndicator(id ?? 'Balance')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'order' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.order.label')}
          options={orderOptions}
          selectedId={transactionOrder}
          onSelect={(id) => setTransactionOrder(id ?? 'MostRecentFirst')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'upcoming' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title={t('budget.create.upcoming.label')}
          options={upcomingOptions}
          selectedId={upcomingDisplayMode}
          onSelect={(id) => setUpcomingDisplayMode(id ?? 'Expanded')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {spendingLimitOpen ? (
        <SpendingLimitSheet
          currencyCode={currencyCode}
          value={spendingLimit}
          onClose={() => setSpendingLimitOpen(false)}
          onSave={(value) => setSpendingLimit(value)}
        />
      ) : null}
    </div>
  )
}
