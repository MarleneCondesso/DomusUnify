import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { domusApi } from '../../api/domusApi'
import { ApiError, type ApiDownloadResult } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { BottomSheetPicker } from '../../ui/BottomSheetPicker'
import { DatePickerSheet } from '../../ui/DatePickerSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'

type Props = {
  token: string
  initialBudgetId: string
  initialFrom: string
  initialTo: string
  onClose: () => void
}

function downloadBlob({ blob, fileName }: ApiDownloadResult, fallbackName: string) {
  const name = (fileName ?? '').trim() || fallbackName
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeFileName(name: string): string {
  const trimmed = (name ?? '').trim() || 'export'
  return trimmed.replace(/[\\/:*?"<>|]+/g, '-')
}

export function ExportDataSheet({ token, initialBudgetId, initialFrom, initialTo, onClose }: Props) {
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()

  const [budgetId, setBudgetId] = useState(initialBudgetId)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false)
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null)

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: () => domusApi.getBudgets(token),
  })

  const selectedBudget = useMemo(() => {
    return (budgetsQuery.data ?? []).find((b) => b.id === budgetId) ?? null
  }, [budgetId, budgetsQuery.data])

  const isRangeValid = Boolean(from) && Boolean(to) && from <= to

  const transactionsQuery = useQuery({
    queryKey: isRangeValid ? queryKeys.budgetTransactions({ budgetId, from, to }) : ['budgetTransactionsExport', budgetId, from, to],
    queryFn: () => domusApi.getBudgetTransactions(token, budgetId, { from, to }),
    enabled: Boolean(budgetId) && isRangeValid,
  })

  const exportMutation = useMutation({
    mutationFn: () => domusApi.exportBudgetTransactionsCsv(token, budgetId, { from, to, delimiter: ';' }),
    onSuccess: async (file) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityRecent(4) })

      const name = selectedBudget?.name ?? t('budget.export.budgetFallbackName')
      const fallback = `${safeFileName(name)}-${from}-${to}.csv`
      downloadBlob(file, fallback)
      onClose()
    },
  })

  const exportError = exportMutation.error instanceof ApiError ? exportMutation.error : null

  const budgetOptions = useMemo(() => {
    return (budgetsQuery.data ?? [])
      .filter((b) => Boolean(b.id))
      .map((b) => {
        const emoji = iconKeyToEmoji(b.iconKey ?? null) ?? '💰'
        return { id: b.id!, label: `${emoji} ${b.name ?? '—'}` }
      })
  }, [budgetsQuery.data])

  const count = transactionsQuery.data?.length ?? 0

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>
            <div className="h-10 w-10" />
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div className="text-center">
            <div className="text-4xl font-black text-charcoal">
              {t('budget.export.title')} <span aria-hidden="true">📊</span>
            </div>
            <div className="mt-3 text-base font-semibold text-charcoal/80">
              {t('budget.export.subtitle')}
            </div>
          </div>

          {exportError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">{t('budget.export.errorTitle')}</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {JSON.stringify(exportError.body, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-sand-light disabled:opacity-60"
              onClick={() => setBudgetPickerOpen(true)}
              disabled={budgetsQuery.isLoading || budgetsQuery.isError}
            >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-xl">
                    <span aria-hidden="true">{selectedBudget ? iconKeyToEmoji(selectedBudget.iconKey ?? null) ?? '💰' : '💰'}</span>
                  </div>
                  <div className="truncate text-base font-extrabold text-charcoal">
                    {selectedBudget?.name ?? t('budget.export.budgetFallbackName')}
                  </div>
                </div>
              <i className="ri-arrow-down-s-line text-2xl text-gray-500" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 px-4 py-4">
              <i className="ri-calendar-event-line text-2xl text-gray-500" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="text-base font-extrabold text-charcoal">{t('budget.export.fromLabel')}</div>
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25 hover:bg-sand-light"
                  onClick={() => setDatePickerTarget('from')}
                  aria-label={t('budget.export.selectFromDate')}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular-nums">{formatDateLabel(from, locale)}</span>
                    <i className="ri-calendar-line text-lg text-gray-400" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-4">
              <i className="ri-calendar-check-line text-2xl text-gray-500" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="text-base font-extrabold text-charcoal">{t('budget.export.toLabel')}</div>
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25 hover:bg-sand-light"
                  onClick={() => setDatePickerTarget('to')}
                  aria-label={t('budget.export.selectToDate')}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular-nums">{formatDateLabel(to, locale)}</span>
                    <i className="ri-calendar-line text-lg text-gray-400" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-2xl font-extrabold text-charcoal">
            {transactionsQuery.isLoading ? (
              <span className="inline-flex items-center gap-2 text-base font-semibold text-charcoal/70">
                <LoadingSpinner />
                {t('budget.export.count.loading')}
              </span>
            ) : transactionsQuery.isError ? (
              <span className="text-base font-semibold text-red-700">{t('budget.export.count.error')}</span>
            ) : (
              <>
                {t('budget.export.count.found', { count })} <span aria-hidden="true">🤔</span>
              </>
            )}
          </div>

          <button
            type="button"
            className="mt-8 w-full rounded-full bg-blue-500 px-6 py-4 text-center text-lg font-extrabold text-white shadow-lg hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-500"
            onClick={() => exportMutation.mutate()}
            disabled={!isRangeValid || exportMutation.isPending || budgetsQuery.isLoading}
          >
            {exportMutation.isPending ? t('budget.export.exporting') : t('budget.export.export')}
          </button>
        </div>
      </div>

      {budgetPickerOpen ? (
        <BottomSheetPicker
          title={t('budget.export.budgetPickerTitle')}
          options={budgetOptions}
          selectedId={budgetId}
          onSelect={(id) => id && setBudgetId(id)}
          onClose={() => setBudgetPickerOpen(false)}
          isLoading={budgetsQuery.isLoading}
          zIndexClass="z-[100]"
        />
      ) : null}

      {datePickerTarget ? (
        <DatePickerSheet
          title={t('budget.export.selectDate')}
          value={datePickerTarget === 'from' ? from : to}
          min={datePickerTarget === 'to' ? from : null}
          max={datePickerTarget === 'from' ? to : null}
          onClose={() => setDatePickerTarget(null)}
          onConfirm={(v) => {
            if (typeof v !== 'string' || !v) {
              setDatePickerTarget(null)
              return
            }

            if (datePickerTarget === 'from') setFrom(v)
            else setTo(v)

            setDatePickerTarget(null)
          }}
          zIndexClass="z-[120]"
        />
      ) : null}
    </div>
  )
}

function formatDateLabel(isoDate: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate ?? '').trim())
  if (!m) return (isoDate ?? '').trim() || '—'

  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])

  const dt = new Date(y, mo, d, 0, 0, 0, 0)
  if (Number.isNaN(dt.getTime())) return isoDate
  return dt.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}
