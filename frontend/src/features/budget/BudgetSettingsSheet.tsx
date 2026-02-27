import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type BudgetDetailResponse, type UpdateBudgetRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { BottomSheetPicker, type BottomSheetOption } from '../../ui/BottomSheetPicker'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'

type Props = {
  token: string
  budget: BudgetDetailResponse
  onClose: () => void
}

type PickerId = null | 'period' | 'currency' | 'indicator' | 'order' | 'upcoming' | 'visibility'

const PERIOD_OPTIONS: BottomSheetOption[] = [
  { id: 'Monthly', label: 'Mensal' },
  { id: 'Weekly', label: 'Semanal' },
  { id: 'BiWeekly', label: 'Quinzenal' },
  { id: 'SemiMonthly', label: 'Semi-mensal' },
  { id: 'Yearly', label: 'Anual' },
]

const CURRENCY_OPTIONS: BottomSheetOption[] = [
  { id: 'EUR', label: 'EUR' },
  { id: 'USD', label: 'USD' },
  { id: 'GBP', label: 'GBP' },
  { id: 'BRL', label: 'BRL' },
]

const INDICATOR_OPTIONS: BottomSheetOption[] = [
  { id: 'Balance', label: 'Saldo do mês' },
  { id: 'BalanceToday', label: 'Saldo de hoje' },
  { id: 'TotalExpenses', label: 'Despesas este mês' },
  { id: 'TotalIncome', label: 'Renda este mês' },
]

const ORDER_OPTIONS: BottomSheetOption[] = [
  { id: 'MostRecentFirst', label: 'Mais recente primeiro' },
  { id: 'OldestFirst', label: 'Mais antigas primeiro' },
]

const UPCOMING_OPTIONS: BottomSheetOption[] = [
  { id: 'Expanded', label: 'Expandido' },
  { id: 'Collapsed', label: 'Caído' },
]

const VISIBILITY_OPTIONS: BottomSheetOption[] = [
  { id: 'AllMembers', label: 'Todos os membros' },
  { id: 'Private', label: 'Privado (só eu)' },
  { id: 'SpecificMembers', label: 'Membros específicos' },
]

type RowProps = {
  icon: string
  label: string
  value: string
  valueTone?: 'default' | 'accent'
  onPress?: () => void
}

function SettingsRow({ icon, label, value, valueTone = 'default', onPress }: RowProps) {
  const interactive = Boolean(onPress)
  const valueClass = valueTone === 'accent' ? 'text-blue-600' : 'text-charcoal/60'

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left ${
        interactive ? 'hover:bg-sand-light' : ''
      }`}
      onClick={onPress}
      disabled={!interactive}
    >
      <div className="flex min-w-0 items-center gap-4">
        <i className={`${icon} text-2xl text-gray-400`} aria-hidden="true" />
        <div className="truncate text-base font-semibold text-charcoal">{label}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
        {interactive ? <i className="ri-arrow-right-s-line text-2xl text-gray-300" aria-hidden="true" /> : null}
      </div>
    </button>
  )
}

function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const code = (currencyCode || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: code }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${code}`
  }
}

function periodValueLabel(periodType: string, startDate: string | null | undefined): string {
  const typeLabel = PERIOD_OPTIONS.find((o) => o.id === periodType)?.label ?? '—'
  const day = startDate ? new Date(`${startDate}T00:00:00Z`).getUTCDate() : 1

  if (periodType === 'Monthly') return `${typeLabel} | Dia ${Number.isFinite(day) ? day : 1}`
  return typeLabel
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
  const [raw, setRaw] = useState(() => (value === null || value === undefined ? '' : String(value)))

  const parsed = useMemo(() => {
    const normalized = raw.trim().replace(',', '.')
    if (!normalized) return null
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
  }, [raw])

  const canSave = parsed !== null

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light" onClick={onClose} aria-label="Cancelar">
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>
            <div className="text-base font-semibold text-charcoal">Limite de orçamento</div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={() => parsed !== null && onSave(parsed)}
              disabled={!canSave}
              aria-label="Guardar"
            >
              <i className="ri-check-line text-2xl text-blue-600" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <label className="mb-2 block text-xs font-semibold text-charcoal/60">Valor</label>
          <input
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Ex.: 250 (${currencyCode.toUpperCase()})`}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
          />

          {value !== null && value !== undefined ? (
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              onClick={() => onSave(null)}
            >
              Remover limite
            </button>
          ) : null}

          <div className="mt-3 text-xs text-charcoal/60">
            Valor atual: {value === null || value === undefined ? 'Sem limite' : formatCurrency(value, currencyCode)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BudgetSettingsSheet({ token, budget, onClose }: Props) {
  const queryClient = useQueryClient()

  const budgetId = budget.id ?? null
  const existingAllowedUserIds = useMemo(() => budget.allowedUserIds ?? null, [budget.allowedUserIds])
  const initial = useMemo(() => {
    return {
      periodType: (budget.periodType ?? 'Monthly') || 'Monthly',
      startDate: budget.startDate ?? null,
      spendingLimit: budget.spendingLimit ?? null,
      currencyCode: (budget.currencyCode ?? 'EUR').toUpperCase(),
      visibilityMode: (budget.visibilityMode ?? 'AllMembers') || 'AllMembers',
      mainIndicator: (budget.mainIndicator ?? 'Balance') || 'Balance',
      transactionOrder: (budget.transactionOrder ?? 'MostRecentFirst') || 'MostRecentFirst',
      upcomingDisplayMode: (budget.upcomingDisplayMode ?? 'Expanded') || 'Expanded',
    }
  }, [budget.currencyCode, budget.mainIndicator, budget.periodType, budget.spendingLimit, budget.startDate, budget.transactionOrder, budget.upcomingDisplayMode, budget.visibilityMode])

  const [picker, setPicker] = useState<PickerId>(null)
  const [limitOpen, setLimitOpen] = useState(false)

  const [periodType, setPeriodType] = useState(initial.periodType)
  const [currencyCode, setCurrencyCode] = useState(initial.currencyCode)
  const [visibilityMode, setVisibilityMode] = useState(initial.visibilityMode)
  const [allowedUserIds] = useState<string[] | null>(existingAllowedUserIds)
  const [mainIndicator, setMainIndicator] = useState(initial.mainIndicator)
  const [transactionOrder, setTransactionOrder] = useState(initial.transactionOrder)
  const [upcomingDisplayMode, setUpcomingDisplayMode] = useState(initial.upcomingDisplayMode)
  const [spendingLimit, setSpendingLimit] = useState<number | null>(initial.spendingLimit)
  const [spendingLimitTouched, setSpendingLimitTouched] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (req: UpdateBudgetRequest) => {
      if (!budgetId) throw new Error('BudgetId em falta')
      return domusApi.updateBudget(token, budgetId, req)
    },
    onSuccess: async () => {
      if (budgetId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
        await queryClient.invalidateQueries({ queryKey: queryKeys.budgetById(budgetId) })
        await queryClient.invalidateQueries({ queryKey: ['budgetTotals', budgetId] })
        await queryClient.invalidateQueries({ queryKey: ['budgetTransactions', budgetId] })
      }
      onClose()
    },
  })

  const errorMessage = useMemo(() => {
    const err = updateMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [updateMutation.error])

  const hasChanges =
    spendingLimitTouched ||
    periodType !== initial.periodType ||
    currencyCode !== initial.currencyCode ||
    visibilityMode !== initial.visibilityMode ||
    mainIndicator !== initial.mainIndicator ||
    transactionOrder !== initial.transactionOrder ||
    upcomingDisplayMode !== initial.upcomingDisplayMode

  const submit = () => {
    if (updateMutation.isPending) return
    if (!hasChanges) {
      onClose()
      return
    }
    if (!budgetId) {
      onClose()
      return
    }

    const req: UpdateBudgetRequest = {}

    if (periodType !== initial.periodType) req.periodType = periodType
    if (currencyCode !== initial.currencyCode) req.currencyCode = currencyCode
    if (visibilityMode !== initial.visibilityMode) req.visibilityMode = visibilityMode
    if (mainIndicator !== initial.mainIndicator) req.mainIndicator = mainIndicator
    if (transactionOrder !== initial.transactionOrder) req.transactionOrder = transactionOrder
    if (upcomingDisplayMode !== initial.upcomingDisplayMode) req.upcomingDisplayMode = upcomingDisplayMode

    if (spendingLimitTouched) {
      req.spendingLimit = spendingLimit
      req.spendingLimitChangeRequested = true
    }

    if (visibilityMode === 'SpecificMembers') req.allowedUserIds = allowedUserIds
    else req.allowedUserIds = null

    updateMutation.mutate(req)
  }

  const emoji = iconKeyToEmoji(budget.iconKey ?? null) ?? '💰'

  const spendingLimitLabel =
    spendingLimit === null || spendingLimit === undefined ? '+ Configurar' : formatCurrency(Math.abs(spendingLimit), currencyCode)
  const spendingLimitTone: RowProps['valueTone'] =
    spendingLimit === null || spendingLimit === undefined ? 'accent' : 'default'

  const visibilityLabel = VISIBILITY_OPTIONS.find((x) => x.id === visibilityMode)?.label ?? '—'
  const indicatorLabel = INDICATOR_OPTIONS.find((x) => x.id === mainIndicator)?.label ?? '—'
  const orderLabel = ORDER_OPTIONS.find((x) => x.id === transactionOrder)?.label ?? '—'
  const upcomingLabel = UPCOMING_OPTIONS.find((x) => x.id === upcomingDisplayMode)?.label ?? '—'

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onClose}
              disabled={updateMutation.isPending}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>

            <div className="text-base font-semibold text-charcoal">Configurações</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={submit}
              disabled={updateMutation.isPending || !hasChanges}
              aria-label="Guardar"
              title="Guardar"
            >
              <i className={updateMutation.isPending ? 'ri-loader-4-line animate-spin text-2xl text-blue-600' : 'ri-check-line text-2xl text-blue-600'} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {errorMessage ? (
            <div className="mx-4 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="px-4 pb-4 pt-1">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-sand-light text-3xl">{emoji}</div>
              <div className="min-w-0">
                <div className="truncate text-2xl font-extrabold text-charcoal">{budget.name ?? 'Orçamento'}</div>
              </div>
            </div>
          </div>

          <div className="mx-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <SettingsRow
              icon="ri-calendar-2-line"
              label="Período do orçamento"
              value={periodValueLabel(periodType, initial.startDate)}
              onPress={() => setPicker('period')}
            />

            <SettingsRow
              icon="ri-target-line"
              label="Limite de orçamento"
              value={spendingLimitLabel}
              valueTone={spendingLimitTone}
              onPress={() => setLimitOpen(true)}
            />

            <SettingsRow
              icon="ri-user-settings-line"
              label="Visível para:"
              value={visibilityLabel}
              valueTone="accent"
              onPress={() => setPicker('visibility')}
            />
          </div>

          <div className="mx-4 mt-3 text-xs font-extrabold tracking-widest text-gray-400">CONFIGURAÇÕES DE EXIBIÇÃO</div>

          <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <SettingsRow icon="ri-money-euro-circle-line" label="Moeda" value={currencyCode} onPress={() => setPicker('currency')} />
            <SettingsRow icon="ri-bar-chart-2-line" label="Indicadores" value={indicatorLabel} onPress={() => setPicker('indicator')} />
            <SettingsRow icon="ri-sort-desc" label="Ordenação" value={orderLabel} onPress={() => setPicker('order')} />
            <SettingsRow icon="ri-timer-2-line" label="Próximas transações" value={upcomingLabel} onPress={() => setPicker('upcoming')} />
          </div>

          <div className="mx-4 mt-4 text-xs text-charcoal/60">
            {visibilityMode === 'AllMembers'
              ? 'Este orçamento pode ser visualizado e editado por todos os membros deste Círculo.'
              : visibilityMode === 'Private'
                ? 'Este orçamento é privado e só pode ser visualizado e editado por si.'
                : 'Este orçamento é visível apenas para membros específicos.'}
          </div>
        </div>
      </div>

      {picker === 'period' ? (
        <BottomSheetPicker
          title="Período do orçamento"
          options={PERIOD_OPTIONS}
          selectedId={periodType}
          onSelect={(id) => id && setPeriodType(id)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {picker === 'currency' ? (
        <BottomSheetPicker
          title="Moeda"
          options={CURRENCY_OPTIONS}
          selectedId={currencyCode}
          onSelect={(id) => id && setCurrencyCode(id.toUpperCase())}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {picker === 'indicator' ? (
        <BottomSheetPicker
          title="Indicadores"
          options={INDICATOR_OPTIONS}
          selectedId={mainIndicator}
          onSelect={(id) => id && setMainIndicator(id)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {picker === 'order' ? (
        <BottomSheetPicker
          title="Ordenação"
          options={ORDER_OPTIONS}
          selectedId={transactionOrder}
          onSelect={(id) => id && setTransactionOrder(id)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {picker === 'upcoming' ? (
        <BottomSheetPicker
          title="Próximas transações"
          options={UPCOMING_OPTIONS}
          selectedId={upcomingDisplayMode}
          onSelect={(id) => id && setUpcomingDisplayMode(id)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {picker === 'visibility' ? (
        <BottomSheetPicker
          title="Visível para"
          options={
            initial.visibilityMode === 'SpecificMembers' || (existingAllowedUserIds?.length ?? 0) > 0
              ? VISIBILITY_OPTIONS
              : VISIBILITY_OPTIONS.filter((o) => o.id !== 'SpecificMembers')
          }
          selectedId={visibilityMode}
          onSelect={(id) => {
            if (!id) return
            if (id === 'SpecificMembers' && (existingAllowedUserIds?.length ?? 0) === 0) {
              window.alert('Seleção de membros (visibilidade) em breve.')
              return
            }
            setVisibilityMode(id)
          }}
          onClose={() => setPicker(null)}
          zIndexClass="z-[90]"
        />
      ) : null}

      {limitOpen ? (
        <SpendingLimitSheet
          currencyCode={currencyCode}
          value={spendingLimit}
          onClose={() => setLimitOpen(false)}
          onSave={(next) => {
            setLimitOpen(false)
            setSpendingLimitTouched(true)
            setSpendingLimit(next)
          }}
        />
      ) : null}
    </div>
  )
}
