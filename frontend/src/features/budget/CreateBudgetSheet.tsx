import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateBudgetRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { BottomSheetPicker, type BottomSheetOption } from '../../ui/BottomSheetPicker'
import { encodeEmojiToIconKey } from '../../utils/emojiIconKey'

type Props = {
  token: string
  defaultCurrencyCode: string
  onClose: () => void
  onCreated: (budgetId: string) => void
}

type PickerId = null | 'periodType' | 'startDay' | 'currency' | 'visibility' | 'indicator' | 'order' | 'upcoming'

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

const VISIBILITY_OPTIONS: BottomSheetOption[] = [
  { id: 'AllMembers', label: 'Todos os membros' },
  { id: 'Private', label: 'Privado (só eu)' },
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

function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const code = (currencyCode || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: code }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${code}`
  }
}

function periodValueLabel(periodType: string, startDay: number): string {
  const typeLabel = PERIOD_OPTIONS.find((o) => o.id === periodType)?.label ?? '—'
  if (periodType === 'Monthly') return `${typeLabel} | Dia ${Number.isFinite(startDay) ? startDay : 1}`
  return typeLabel
}

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
      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left ${interactive ? 'hover:bg-sand-light' : ''}`}
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

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-charcoal">Limite de orçamento</div>
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} aria-label="Fechar">
            <i className="ri-close-line text-xl text-gray-600" />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-charcoal/60">Valor ({currencyCode.toUpperCase()})</label>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 500"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
          />
          <div className="mt-3 text-xs text-charcoal/60">Deixe vazio para remover o limite.</div>
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
            Sem limite
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={raw.trim() !== '' && parsed === null}
            onClick={() => {
              onSave(parsed)
              onClose()
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export function CreateBudgetSheet({ token, defaultCurrencyCode, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)

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

  const startDayOptions: BottomSheetOption[] = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ id: String(i + 1), label: `Dia ${i + 1}` })),
    [],
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
    spendingLimit === null || spendingLimit === undefined ? '+ Configurar' : formatCurrency(Math.abs(spendingLimit), currencyCode)
  const spendingLimitTone: RowProps['valueTone'] =
    spendingLimit === null || spendingLimit === undefined ? 'accent' : 'default'

  const visibilityLabel = VISIBILITY_OPTIONS.find((x) => x.id === visibilityMode)?.label ?? '—'
  const indicatorLabel = INDICATOR_OPTIONS.find((x) => x.id === mainIndicator)?.label ?? '—'
  const orderLabel = ORDER_OPTIONS.find((x) => x.id === transactionOrder)?.label ?? '—'
  const upcomingLabel = UPCOMING_OPTIONS.find((x) => x.id === upcomingDisplayMode)?.label ?? '—'

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
              disabled={createMutation.isPending}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>

            <div className="text-base font-semibold text-charcoal">Novo orçamento</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label="Guardar"
              title="Guardar"
            >
              <i
                className={
                  createMutation.isPending
                    ? 'ri-loader-4-line animate-spin text-2xl text-blue-600'
                    : 'ri-check-line text-2xl text-blue-600'
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
                className="h-12 w-12 shrink-0 rounded-2xl border border-gray-200 bg-sand-light text-center text-2xl outline-none focus:ring-2 focus:ring-blue-500/25"
                disabled={createMutation.isPending}
                aria-label="Ícone"
              />
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do orçamento"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base font-semibold text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
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
              label="Período do orçamento"
              value={periodValueLabel(periodType, startDay)}
              onPress={() => setPicker('periodType')}
            />

            {periodType === 'Monthly' ? (
              <SettingsRow
                icon="ri-calendar-check-line"
                label="Dia do mês"
                value={`Dia ${startDay}`}
                onPress={() => setPicker('startDay')}
              />
            ) : null}

            <SettingsRow
              icon="ri-focus-3-line"
              label="Limite de orçamento"
              value={spendingLimitLabel}
              valueTone={spendingLimitTone}
              onPress={() => setSpendingLimitOpen(true)}
            />

            <SettingsRow
              icon="ri-user-settings-line"
              label="Visível para:"
              value={visibilityLabel}
              valueTone="accent"
              onPress={() => setPicker('visibility')}
            />
          </div>

          <div className="mt-5 text-xs font-semibold tracking-wider text-charcoal/50">CONFIGURAÇÕES DE EXIBIÇÃO</div>

          <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <SettingsRow
              icon="ri-money-euro-circle-line"
              label="Moeda"
              value={currencyCode.toUpperCase()}
              onPress={() => setPicker('currency')}
            />

            <SettingsRow
              icon="ri-bar-chart-2-line"
              label="Indicadores"
              value={indicatorLabel}
              onPress={() => setPicker('indicator')}
            />

            <SettingsRow
              icon="ri-sort-desc"
              label="Ordenação"
              value={orderLabel}
              onPress={() => setPicker('order')}
            />

            <SettingsRow
              icon="ri-time-line"
              label="Próximas transações"
              value={upcomingLabel}
              onPress={() => setPicker('upcoming')}
            />

            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <i className="ri-checkbox-circle-line text-2xl text-gray-400" aria-hidden="true" />
                <div className="truncate text-base font-semibold text-charcoal">Apenas pagos nos totais</div>
              </div>
              <button
                type="button"
                className={`relative h-7 w-12 rounded-full transition ${onlyPaidInTotals ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setOnlyPaidInTotals((v) => !v)}
                disabled={createMutation.isPending}
                aria-label="Apenas pagos nos totais"
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
          title="Período do orçamento"
          options={PERIOD_OPTIONS}
          selectedId={periodType}
          onSelect={(id) => setPeriodType(id ?? 'Monthly')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'startDay' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title="Dia do mês"
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
          title="Moeda"
          options={CURRENCY_OPTIONS}
          selectedId={currencyCode}
          onSelect={(id) => setCurrencyCode((id ?? 'EUR').toUpperCase())}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'visibility' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title="Visível para"
          options={VISIBILITY_OPTIONS}
          selectedId={visibilityMode}
          onSelect={(id) => setVisibilityMode(id ?? 'AllMembers')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'indicator' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title="Indicador principal"
          options={INDICATOR_OPTIONS}
          selectedId={mainIndicator}
          onSelect={(id) => setMainIndicator(id ?? 'Balance')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'order' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title="Ordenação"
          options={ORDER_OPTIONS}
          selectedId={transactionOrder}
          onSelect={(id) => setTransactionOrder(id ?? 'MostRecentFirst')}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'upcoming' ? (
        <BottomSheetPicker
          zIndexClass="z-[90]"
          title="Próximas transações"
          options={UPCOMING_OPTIONS}
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

