import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  domusApi,
  type AccountSummaryResponse,
  type BudgetMemberResponse,
  type CategorySummaryResponse,
  type FamilyResponse,
  type FinanceAccountResponse,
  type FinanceTransactionResponse,
  type MemberSummaryResponse,
} from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import type { Language, MessageKey } from '../../i18n/messages'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { SwipeableRow } from '../../ui/SwipeableRow'
import { TimePickerSheet } from '../../ui/TimePickerSheet'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getFinanceCategoryDisplayName } from '../../utils/categoryLocalization'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { financeCategoryEmoji } from '../../utils/financeCategoryEmoji'
import { capitalizeFirst, formatCurrency, formatMonthYear } from '../../utils/intl'
import { AddTransactionSheet } from './AddTransactionSheet'
import { BudgetOptionsSheet } from './BudgetOptionsSheet'
import { BudgetSettingsSheet } from './BudgetSettingsSheet'
import { BudgetSwitcherSheet } from './BudgetSwitcherSheet'
import { CreateBudgetSheet } from './CreateBudgetSheet'
import { ExportDataSheet } from './ExportDataSheet'

type Props = {
  token: string
  family: FamilyResponse
}

type TabId = 'list' | 'categories' | 'members' | 'accounts'
type IndicatorId = 'Balance' | 'TotalExpenses' | 'TotalIncome' | 'BalanceToday'

type CategoryDrilldown = {
  categoryId: string
  categoryName: string
  categoryNameRaw: string
  categoryIconKey: string | null
  totalAbs: number
  percentage: number
  type: 'Expense' | 'Income'
}

const TAB_DEFS = [
  { id: 'list', labelKey: 'budget.tabs.list', icon: 'ri-file-list-3-line' },
  { id: 'categories', labelKey: 'budget.tabs.categories', icon: 'ri-folder-3-line' },
  { id: 'members', labelKey: 'budget.tabs.members', icon: 'ri-user-3-line' },
  { id: 'accounts', labelKey: 'budget.tabs.accounts', icon: 'ri-bank-card-line' },
 ] as const satisfies Array<{ id: TabId; labelKey: MessageKey; icon: string }>

const INDICATOR_OPTIONS = [
  { id: 'Balance', labelKey: 'budget.indicator.balanceMonth', icon: 'ri-money-euro-circle-line' },
  { id: 'BalanceToday', labelKey: 'budget.indicator.balanceToday', icon: 'ri-calendar-check-line' },
  { id: 'TotalExpenses', labelKey: 'budget.indicator.totalExpenses', icon: 'ri-arrow-right-down-line' },
  { id: 'TotalIncome', labelKey: 'budget.indicator.totalIncome', icon: 'ri-arrow-left-up-line' },
 ] as const satisfies Array<{ id: IndicatorId; labelKey: MessageKey; icon: string }>

const INDICATOR_CYCLE: IndicatorId[] = ['Balance', 'BalanceToday', 'TotalExpenses', 'TotalIncome']

const DAILY_REMINDER_NOTE_PREFIX = 'domus:budget-daily-reminder:'
const DAILY_REMINDER_TIME_STORAGE_KEY_PREFIX = 'domus:budget-daily-reminder-time:'

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string

export function BudgetPage({ token }: Props) {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale, language } = useI18n()

  const [tab, setTab] = useState<TabId>('list')
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), monthIndex0: now.getMonth() }
  })
  const [indicator, setIndicator] = useState<IndicatorId>('Balance')
  const [budgetSwitcherOpen, setBudgetSwitcherOpen] = useState(false)
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransactionResponse | null>(null)
  const [categoryDrilldown, setCategoryDrilldown] = useState<CategoryDrilldown | null>(null)
  const [dailyReminderTime, setDailyReminderTime] = useState('20:00')
  const [dailyReminderTimeOpen, setDailyReminderTimeOpen] = useState(false)
  const [dailyReminderTimeDraft, setDailyReminderTimeDraft] = useState('20:00')
  const [deletingTransactionIds, setDeletingTransactionIds] = useState<Set<string>>(() => new Set())

  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const yesterdayUtc = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10), [])
  const period = useMemo(() => utcMonthRange(cursor.year, cursor.monthIndex0), [cursor.monthIndex0, cursor.year])

  const detailQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetById(budgetId) : ['budgetById', null],
    queryFn: () => domusApi.getBudgetById(token, budgetId!),
    enabled: Boolean(budgetId),
  })

  const currencyCode = (detailQuery.data?.currencyCode ?? 'EUR') || 'EUR'

  const periodFrom = period.from
  const periodTo = period.to

  const transactionsQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo }) : ['budgetTransactions', null],
    queryFn: () => domusApi.getBudgetTransactions(token, budgetId!, { from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId),
  })

  const categoriesExpensesQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryCategories({ budgetId, type: 'Expense', from: periodFrom, to: periodTo })
      : ['budgetSummaryCategories', null],
    queryFn: () =>
      domusApi.getBudgetSummaryByCategories(token, budgetId!, { type: 'Expense', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'categories',
  })

  const categoriesIncomeQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryCategories({ budgetId, type: 'Income', from: periodFrom, to: periodTo })
      : ['budgetSummaryCategoriesIncome', null],
    queryFn: () =>
      domusApi.getBudgetSummaryByCategories(token, budgetId!, { type: 'Income', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'categories',
  })

  const budgetMembersQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetMembers(budgetId) : ['budgetMembers', null],
    queryFn: () => domusApi.getBudgetMembers(token, budgetId!),
    enabled: Boolean(budgetId) && tab === 'members',
  })

  const membersExpensesQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryMembers({ budgetId, type: 'Expense', from: periodFrom, to: periodTo })
      : ['budgetSummaryMembers', null],
    queryFn: () =>
      domusApi.getBudgetSummaryByMembers(token, budgetId!, { type: 'Expense', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'members',
  })

  const membersIncomeQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryMembers({ budgetId, type: 'Income', from: periodFrom, to: periodTo })
      : ['budgetSummaryMembersIncome', null],
    queryFn: () => domusApi.getBudgetSummaryByMembers(token, budgetId!, { type: 'Income', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'members',
  })

  const accountsExpensesQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryAccounts({ budgetId, type: 'Expense', from: periodFrom, to: periodTo })
      : ['budgetSummaryAccounts', null],
    queryFn: () =>
      domusApi.getBudgetSummaryByAccounts(token, budgetId!, { type: 'Expense', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'accounts',
  })

  const accountsIncomeQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryAccounts({ budgetId, type: 'Income', from: periodFrom, to: periodTo })
      : ['budgetSummaryAccountsIncome', null],
    queryFn: () => domusApi.getBudgetSummaryByAccounts(token, budgetId!, { type: 'Income', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'accounts',
  })

  const visibleAccountsQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetAccountsVisible(budgetId) : ['budgetAccountsVisible', null],
    queryFn: () => domusApi.getBudgetVisibleAccounts(token, budgetId!),
    enabled: Boolean(budgetId) && tab === 'accounts',
  })

  const dailyReminderQueryKey = budgetId ? (['budgetDailyReminder', budgetId] as const) : (['budgetDailyReminder', null] as const)

  const dailyReminderQuery = useQuery<{ eventId: string; startUtc: string | null } | null>({
    queryKey: dailyReminderQueryKey,
    queryFn: async () => {
      const now = Date.now()
      const fromUtc = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      const toUtc = new Date(now + 45 * 24 * 60 * 60 * 1000).toISOString()

      const tag = `${DAILY_REMINDER_NOTE_PREFIX}${budgetId}`
      const events = await domusApi.getCalendarEvents(token, fromUtc, toUtc, undefined, undefined, undefined, 2000)
      const match = events.find((e) => (e.note ?? '').includes(tag))
      if (!match?.id) return null
      return { eventId: match.id, startUtc: match.startUtc ?? null }
    },
    enabled: Boolean(budgetId) && optionsOpen,
    staleTime: 30_000,
  })

  const dailyReminderEventId = dailyReminderQuery.data?.eventId ?? null
  const dailyReminderEnabled = Boolean(dailyReminderEventId)

  const dailyReminderMutation = useMutation({
    mutationFn: async (vars: { nextEnabled: boolean; time: string }): Promise<{ eventId: string; startUtc: string | null } | null> => {
      if (!budgetId) return null

      if (vars.nextEnabled) {
        const budgetName = (detailQuery.data?.name ?? t('budget.fallbackName')).trim() || t('budget.fallbackName')
        const note = `${DAILY_REMINDER_NOTE_PREFIX}${budgetId}`

        const parsed = parseHm(vars.time)
        if (!parsed) throw new Error(t('budget.time.invalid'))

        const now = new Date()
        const start = new Date(now)
        start.setHours(parsed.hours, parsed.minutes, 0, 0)
        if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1)
        const end = new Date(start.getTime() + 15 * 60 * 1000)

        const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone

        const created = await domusApi.createCalendarEvent(token, {
          title: t('budget.dailyReminder.title', { budgetName }),
          isAllDay: false,
          startUtc: start.toISOString(),
          endUtc: end.toISOString(),
          participantsAllMembers: true,
          visibleToAllMembers: true,
          reminderOffsetsMinutes: [0],
          note,
          recurrenceRule: 'FREQ=DAILY',
          timezoneId,
        })

        if (!created.id) return null
        return { eventId: created.id, startUtc: created.startUtc ?? start.toISOString() }
      }

      if (dailyReminderEventId) {
        await domusApi.deleteCalendarEvent(token, dailyReminderEventId)
      }

      return null
    },
    onSuccess: async (nextId) => {
      queryClient.setQueryData(dailyReminderQueryKey, nextId)
      await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('budget.dailyReminder.updateError'))
    },
  })

  const dailyReminderTimeMutation = useMutation({
    mutationFn: async (vars: { eventId: string; time: string }): Promise<{ eventId: string; startUtc: string | null }> => {
      const parsed = parseHm(vars.time)
      if (!parsed) throw new Error(t('budget.time.invalid'))

      const now = new Date()
      const start = new Date(now)
      start.setHours(parsed.hours, parsed.minutes, 0, 0)
      if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1)
      const end = new Date(start.getTime() + 15 * 60 * 1000)

      const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone

      await domusApi.updateCalendarEvent(token, vars.eventId, {
        startUtc: start.toISOString(),
        endUtc: end.toISOString(),
        timezoneId,
      })

      return { eventId: vars.eventId, startUtc: start.toISOString() }
    },
    onSuccess: async (next) => {
      queryClient.setQueryData(dailyReminderQueryKey, next)
      await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('budget.dailyReminder.timeUpdateError'))
    },
  })

  const dailyReminderBusy = dailyReminderQuery.isLoading || dailyReminderMutation.isPending || dailyReminderTimeMutation.isPending

  const clearMutation = useMutation({
    mutationFn: () => domusApi.clearBudgetTransactions(token, budgetId!),
    onSuccess: async () => {
      await invalidateBudgetQueries(queryClient, budgetId!, periodFrom, periodTo)
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (vars: { transactionId: string }) => domusApi.deleteBudgetTransaction(token, budgetId!, vars.transactionId),
    onMutate: async (vars) => {
      setDeletingTransactionIds((prev) => {
        const next = new Set(prev)
        next.add(vars.transactionId)
        return next
      })

      if (!budgetId) return undefined

      const key = queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo })
      await queryClient.cancelQueries({ queryKey: key })

      const previous = queryClient.getQueryData<FinanceTransactionResponse[]>(key)
      queryClient.setQueryData<FinanceTransactionResponse[]>(key, (current) => {
        const rows = current ?? []
        return rows.filter((t) => t.id !== vars.transactionId)
      })

      return { previous, key }
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous)
      window.alert(err instanceof Error ? err.message : t('budget.transactions.deleteError'))

      setDeletingTransactionIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.transactionId)
        return next
      })
    },
    onSettled: async (_data, _err, vars) => {
      setDeletingTransactionIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.transactionId)
        return next
      })

      if (budgetId) {
        await invalidateBudgetQueries(queryClient, budgetId, periodFrom, periodTo)
      }
    },
  })

  const financeAccountsById = useMemo(() => {
    const map = new Map<string, FinanceAccountResponse>()

    for (const a of visibleAccountsQuery.data ?? []) {
      if (!a?.id) continue
      map.set(a.id, a)
    }

    return map
  }, [visibleAccountsQuery.data])

  const visibleAccountIds = useMemo(() => {
    const rows = visibleAccountsQuery.data
    if (!rows) return null

    const set = new Set<string>()
    for (const a of rows) {
      const id = (a.id ?? '').trim()
      if (id) set.add(id)
    }
    return set
  }, [visibleAccountsQuery.data])

  const accountsExpensesVisibleRows = useMemo(() => {
    const rows = accountsExpensesQuery.data ?? []
    if (!visibleAccountIds) return rows

    return rows.filter((r) => {
      const id = (r.accountId ?? '').trim()
      return id && visibleAccountIds.has(id)
    })
  }, [accountsExpensesQuery.data, visibleAccountIds])

  const accountsIncomeVisibleRows = useMemo(() => {
    const rows = accountsIncomeQuery.data ?? []
    if (!visibleAccountIds) return rows

    return rows.filter((r) => {
      const id = (r.accountId ?? '').trim()
      return id && visibleAccountIds.has(id)
    })
  }, [accountsIncomeQuery.data, visibleAccountIds])

  const indicatorDef = INDICATOR_OPTIONS.find((x) => x.id === indicator) ?? INDICATOR_OPTIONS[0]!

  const periodTotals = useMemo(() => {
    const rows = transactionsQuery.data ?? []
    const onlyPaid = Boolean(detailQuery.data?.onlyPaidInTotals)

    let income = 0
    let expenses = 0

    for (const t of rows) {
      if (onlyPaid && !t.isPaid) continue
      const raw = Number.isFinite(t.amount) ? (t.amount as number) : 0
      const abs = Math.abs(raw)
      const kind = (t.type ?? '').toLowerCase()
      if (kind === 'income') income += abs
      else if (kind === 'expense') expenses += abs
    }

    return {
      incomeThisPeriod: income,
      expensesThisPeriod: expenses,
      balanceThisPeriod: income - expenses,
    }
  }, [detailQuery.data?.onlyPaidInTotals, transactionsQuery.data])

  const periodToDateTotals = useMemo(() => {
    const rows = transactionsQuery.data ?? []
    const cutoff = todayUtc <= periodTo ? todayUtc : periodTo

    let income = 0
    let expenses = 0

    for (const t of rows) {
      const date = (t.date ?? '').trim()
      if (!date) continue
      if (date > cutoff) continue
      if (t.isPaid !== true) continue

      const raw = Number.isFinite(t.amount) ? (t.amount as number) : 0
      const abs = Math.abs(raw)
      const kind = (t.type ?? '').toLowerCase()
      if (kind === 'income') income += abs
      else if (kind === 'expense') expenses += abs
    }

    return {
      incomeToDate: income,
      expensesToDate: expenses,
      balanceToDate: income - expenses,
    }
  }, [periodTo, todayUtc, transactionsQuery.data])

  const indicatorValue = useMemo(() => {
    switch (indicator) {
      case 'TotalExpenses':
        return periodTotals.expensesThisPeriod
      case 'TotalIncome':
        return periodTotals.incomeThisPeriod
      case 'BalanceToday':
        return periodToDateTotals.balanceToDate
      case 'Balance':
      default:
        return periodTotals.balanceThisPeriod
    }
  }, [indicator, periodToDateTotals.balanceToDate, periodTotals])

  useEffect(() => {
    setTab('list')
    setIndicator('Balance')
    setBudgetSwitcherOpen(false)
    setCreateBudgetOpen(false)
    setOptionsOpen(false)
    setSettingsOpen(false)
    setExportOpen(false)
    setAddOpen(false)
    setEditingTransaction(null)
    setCategoryDrilldown(null)
    setDailyReminderTimeOpen(false)
  }, [budgetId])

  useEffect(() => {
    if (!budgetId) return

    try {
      const stored = window.localStorage.getItem(`${DAILY_REMINDER_TIME_STORAGE_KEY_PREFIX}${budgetId}`)
      if (stored && parseHm(stored)) {
        setDailyReminderTime(stored)
        setDailyReminderTimeDraft(stored)
        return
      }
    } catch {
      // ignore
    }

    setDailyReminderTime('20:00')
    setDailyReminderTimeDraft('20:00')
  }, [budgetId])

  useEffect(() => {
    if (!budgetId) return
    const startUtc = dailyReminderQuery.data?.startUtc
    if (!startUtc) return

    const dt = new Date(startUtc)
    if (Number.isNaN(dt.getTime())) return

    const localTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    if (!parseHm(localTime)) return

    setDailyReminderTime(localTime)
    try {
      window.localStorage.setItem(`${DAILY_REMINDER_TIME_STORAGE_KEY_PREFIX}${budgetId}`, localTime)
    } catch {
      // ignore
    }
  }, [budgetId, dailyReminderQuery.data?.startUtc])

  useEffect(() => {
    const derived = pickIndicatorFromMainIndicator(detailQuery.data?.mainIndicator ?? null)
    if (derived) setIndicator(derived)
  }, [budgetId, detailQuery.data?.mainIndicator])

  const monthLabel = useMemo(() => {
    const d = new Date(cursor.year, cursor.monthIndex0, 1)
    return capitalizeFirst(formatMonthYear(d, locale))
  }, [cursor.monthIndex0, cursor.year, locale])

  const apiDetailError = detailQuery.error instanceof ApiError ? detailQuery.error : null
  const apiTransactionsError = transactionsQuery.error instanceof ApiError ? transactionsQuery.error : null

  if (!budgetId) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">{t('budget.page.invalid.title')}</h2>
        <p className="mt-2 text-sm text-charcoal">{t('budget.page.invalid.subtitle')}</p>
      </div>
    )
  }

  if (detailQuery.isLoading || transactionsQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiDetailError}
        queryKey={queryKeys.budgetById(budgetId)}
        queryClient={queryClient}
        title={t('budget.page.error.budget')}
      />
    )
  }

  if (transactionsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiTransactionsError}
        queryKey={queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo })}
        queryClient={queryClient}
        title={t('budget.page.error.transactions')}
      />
    )
  }

  const detail = detailQuery.data!

  const allTransactions = transactionsQuery.data ?? []
  const upcoming = getUpcomingSummary(allTransactions, todayUtc)
  const upcomingDisplayMode = (detail.upcomingDisplayMode ?? 'Expanded') || 'Expanded'
  const collapseCutoff = todayUtc >= periodFrom && todayUtc <= periodTo ? todayUtc : periodTo
  const visibleTransactions =
    upcomingDisplayMode === 'Collapsed'
      ? allTransactions.filter((t) => {
          const d = (t.date ?? '').trim()
          return Boolean(d) && d <= collapseCutoff
        })
      : allTransactions
  const groups = groupTransactionsByDay(visibleTransactions)

  return (
    <div className="min-h-screen w-full bg-offwhite pb-24">
      <header className="bg-linear-to-b from-sage-light to-offwhite pt-8">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.home')}
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full  bg-white/60 hover:bg-white text-sage-dark disabled:opacity-60"
            aria-label={t('common.menu')}
            onClick={() => setOptionsOpen(true)}
            disabled={clearMutation.isPending}
          >
            <i
              className={`${
                clearMutation.isPending ? 'ri-loader-4-line animate-spin' : 'ri-more-2-fill'
              } text-2xl leading-none`}
            />
          </button>
        </nav>

        <section className="mx-auto w-full max-w-3xl px-4 pb-10 pt-8">
          <div className="w-full rounded-3xl bg-sage-dark p-6 text-left text-white shadow-lg backdrop-blur">
            <button
              type="button"
              className="mb-3 flex w-full items-center gap-3 text-lg font-semibold hover:opacity-95"
              onClick={() => setBudgetSwitcherOpen(true)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/20 text-xl" aria-hidden="true">
                {iconKeyToEmoji(detail.iconKey ?? null) ?? '💰'}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{detail.name ?? t('budget.fallbackName')}</span>
                <i className="ri-arrow-down-s-line text-2xl opacity-90" aria-hidden="true" />
              </span>
            </button>

            <button
              type="button"
              className="block w-full text-left hover:opacity-95"
              onClick={() => setIndicator((prev) => nextIndicator(prev))}
              aria-label={t('budget.indicator.change')}
            >
              <div className="text-6xl font-bold leading-none">{formatCurrency(indicatorValue, currencyCode, locale)}</div>
              <div className="mt-3 text-xl font-semibold text-white">{t(indicatorDef.labelKey)}</div>
            </button>
          </div>
        </section>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4">
        <section className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-white"
            aria-label={t('datePicker.previousMonth')}
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            <i className="ri-arrow-left-s-line text-3xl leading-none" />
          </button>

          <div className="flex items-center gap-2 text-xl font-extrabold text-forest">
            <i className="ri-calendar-2-line text-xl" />
            <span>{monthLabel}</span>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-white"
            aria-label={t('datePicker.nextMonth')}
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <i className="ri-arrow-right-s-line text-3xl leading-none" />
          </button>
        </section>

        <section className="mb-5 flex items-center gap-3 overflow-x-auto pb-1">
          {TAB_DEFS.map((tabDef) => {
            const isActive = tab === tabDef.id
            return (
              <button
                key={tabDef.id}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-transparent bg-forest text-white'
                    : 'border-gray-200 bg-white text-forest hover:bg-sand-light'
                }`}
                onClick={() => setTab(tabDef.id)}
              >
                <i className={`${tabDef.icon} text-xl`} />
                {t(tabDef.labelKey)}
              </button>
            )
          })}
        </section>

        {tab === 'list' ? (
          <section>
            <div className="mb-4 flex items-center justify-between font-bold text-forest">
              <div>{t('budget.upcoming.nextCount', { count: upcoming.count })}</div>
              <div>{formatCurrency(upcoming.total, currencyCode, locale)}</div>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70">
                {t('budget.transactions.emptyPeriod')}
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.date}>
                      <div className="mb-3 flex items-center justify-between font-bold text-sage-dark">
                      <div>{formatDayLabel(g.date, todayUtc, yesterdayUtc, locale, t('common.today'), t('common.yesterday'))}</div>
                      <div>{formatCurrency(g.total, currencyCode, locale)}</div>
                    </div>

                    <div className="space-y-3">
                      {g.rows.map((t, idx) => {
                        const key = t.id ?? `${g.date}-${idx}`
                        const transactionId = t.id
                        const canDelete = Boolean(transactionId) && !deletingTransactionIds.has(transactionId ?? '')

                        return (
                          <SwipeableRow
                            key={key}
                            className="rounded-2xl bg-red-50"
                            disabled={!canDelete}
                            threshold={108}
                            rightAction={
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
                                <i className="ri-delete-bin-6-line text-xl" aria-hidden="true" />
                              </div>
                            }
                            onSwipedLeft={
                              canDelete
                                ? () => {
                                    if (!transactionId) return
                                    deleteTransactionMutation.mutate({ transactionId })
                                  }
                                : undefined
                            }
                          >
                            <TransactionRow row={t} currencyCode={currencyCode} onPress={() => setEditingTransaction(t)} />
                          </SwipeableRow>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'categories' ? (
          <section className="space-y-8">
            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.expensesByCategory')}</div>
              <SummaryListSection
                tone="expense"
                currencyCode={currencyCode}
                isLoading={categoriesExpensesQuery.isLoading}
                isError={categoriesExpensesQuery.isError}
                error={categoriesExpensesQuery.error}
                onRetry={() =>
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryCategories({ budgetId, type: 'Expense', from: periodFrom, to: periodTo }),
                  })
                }
                items={mapCategoryItems(categoriesExpensesQuery.data ?? [], { type: 'Expense', onSelect: setCategoryDrilldown, t, language })}
              />
            </div>

            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.incomeByCategory')}</div>
              <SummaryListSection
                tone="income"
                currencyCode={currencyCode}
                isLoading={categoriesIncomeQuery.isLoading}
                isError={categoriesIncomeQuery.isError}
                error={categoriesIncomeQuery.error}
                onRetry={() =>
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryCategories({ budgetId, type: 'Income', from: periodFrom, to: periodTo }),
                  })
                }
                items={mapCategoryItems(categoriesIncomeQuery.data ?? [], { type: 'Income', onSelect: setCategoryDrilldown, t, language })}
              />
            </div>
          </section>
        ) : null}

        {tab === 'members' ? (
          <section className="space-y-8">
            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.expensesByMember')}</div>
              <SummaryListSection
                tone="expense"
                currencyCode={currencyCode}
                isLoading={membersExpensesQuery.isLoading || budgetMembersQuery.isLoading}
                isError={membersExpensesQuery.isError || budgetMembersQuery.isError}
                error={membersExpensesQuery.error || budgetMembersQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryMembers({ budgetId, type: 'Expense', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.budgetMembers(budgetId) })
                }}
                items={mapMemberItems(membersExpensesQuery.data ?? [], { tone: 'expense', members: budgetMembersQuery.data ?? [], locale, t })}
              />
            </div>

            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.incomeByMember')}</div>
              <SummaryListSection
                tone="income"
                currencyCode={currencyCode}
                isLoading={membersIncomeQuery.isLoading || budgetMembersQuery.isLoading}
                isError={membersIncomeQuery.isError || budgetMembersQuery.isError}
                error={membersIncomeQuery.error || budgetMembersQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryMembers({ budgetId, type: 'Income', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.budgetMembers(budgetId) })
                }}
                items={mapMemberItems(membersIncomeQuery.data ?? [], { tone: 'income', members: budgetMembersQuery.data ?? [], locale, t })}
              />
            </div>
          </section>
        ) : null}

        {tab === 'accounts' ? (
          <section className="space-y-8">
            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.expensesByAccount')}</div>
              <SummaryListSection
                tone="expense"
                currencyCode={currencyCode}
                isLoading={accountsExpensesQuery.isLoading || visibleAccountsQuery.isLoading}
                isError={accountsExpensesQuery.isError || visibleAccountsQuery.isError}
                error={accountsExpensesQuery.error || visibleAccountsQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryAccounts({ budgetId, type: 'Expense', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.budgetAccountsVisible(budgetId!) })
                }}
                items={mapAccountItems(accountsExpensesVisibleRows, {
                  tone: 'expense',
                  accounts: visibleAccountsQuery.data ?? [],
                  financeAccountsById,
                  locale,
                  t,
                })}
              />
            </div>

            <div>
              <div className="mb-3 font-bold text-sage-dark">{t('budget.summary.incomeByAccount')}</div>
              <SummaryListSection
                tone="income"
                currencyCode={currencyCode}
                isLoading={accountsIncomeQuery.isLoading || visibleAccountsQuery.isLoading}
                isError={accountsIncomeQuery.isError || visibleAccountsQuery.isError}
                error={accountsIncomeQuery.error || visibleAccountsQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryAccounts({ budgetId, type: 'Income', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.budgetAccountsVisible(budgetId!) })
                }}
                items={mapAccountItems(accountsIncomeVisibleRows, { tone: 'income', accounts: visibleAccountsQuery.data ?? [], financeAccountsById, locale, t })}
              />
            </div>
          </section>
        ) : null}
      </main>

      <button
        type="button"
        className="fixed bottom-20 right-6 grid h-14 w-14 place-items-center rounded-full bg-amber/60 text-white shadow-2xl hover:bg-amber"
        aria-label={t('budget.transactions.addAria')}
        title={t('budget.transactions.addAria')}
        onClick={() => setAddOpen(true)}
      >
        <i className="ri-add-line text-xl leading-none" />
      </button>

      {budgetSwitcherOpen ? (
        <BudgetSwitcherSheet
          token={token}
          selectedBudgetId={budgetId}
          onClose={() => setBudgetSwitcherOpen(false)}
          onSelectBudget={(nextId) => {
            setBudgetSwitcherOpen(false)
            if (nextId === budgetId) return
            navigate(`/budgets/${nextId}`, { replace: true })
          }}
          onCreateBudget={() => {
            setBudgetSwitcherOpen(false)
            setCreateBudgetOpen(true)
          }}
        />
      ) : null}

      {createBudgetOpen ? (
        <CreateBudgetSheet
          token={token}
          defaultCurrencyCode={currencyCode}
          onClose={() => setCreateBudgetOpen(false)}
          onCreated={(newBudgetId) => {
            setCreateBudgetOpen(false)
            navigate(`/budgets/${newBudgetId}`, { replace: true })
          }}
        />
      ) : null}

      {optionsOpen ? (
        <BudgetOptionsSheet
          onClose={() => setOptionsOpen(false)}
          onOpenBudgetSettings={() => {
            setOptionsOpen(false)
            setSettingsOpen(true)
          }}
          dailyReminderEnabled={dailyReminderEnabled}
          dailyReminderDisabled={dailyReminderBusy}
          onToggleDailyReminder={() => {
            if (dailyReminderBusy) return
            dailyReminderMutation.mutate({ nextEnabled: !dailyReminderEnabled, time: dailyReminderTime })
          }}
          dailyReminderTime={dailyReminderTime}
          onEditDailyReminderTime={() => {
            if (dailyReminderBusy) return
            setDailyReminderTimeDraft(dailyReminderTime)
            setDailyReminderTimeOpen(true)
          }}
          onManageCategories={() => {
            setOptionsOpen(false)
            navigate(`/budgets/${budgetId}/categories`)
          }}
          onManageAccounts={() => {
            setOptionsOpen(false)
            navigate(`/budgets/${budgetId}/accounts`)
          }}
          onChangeBudget={() => {
            setOptionsOpen(false)
            setBudgetSwitcherOpen(true)
          }}
          onExportData={() => {
            setOptionsOpen(false)
            setExportOpen(true)
          }}
          onClearData={() => {
            setOptionsOpen(false)
            if (clearMutation.isPending) return
            const ok = window.confirm(t('budget.clearData.confirm'))
            if (!ok) return
            clearMutation.mutate()
          }}
        />
      ) : null}

      {dailyReminderTimeOpen ? (
        <TimePickerSheet
          title={t('budget.options.reminderTime')}
          value={dailyReminderTimeDraft}
          isBusy={dailyReminderTimeMutation.isPending}
          onClose={() => setDailyReminderTimeOpen(false)}
          onConfirm={(nextTime) => {
            if (!budgetId) return
            const trimmed = (nextTime ?? '').trim()
            if (!parseHm(trimmed)) {
              window.alert(t('budget.time.invalidFormat'))
              return
            }

            setDailyReminderTimeDraft(trimmed)
            setDailyReminderTime(trimmed)
            try {
              window.localStorage.setItem(`${DAILY_REMINDER_TIME_STORAGE_KEY_PREFIX}${budgetId}`, trimmed)
            } catch {
              // ignore
            }

            setDailyReminderTimeOpen(false)
            if (dailyReminderEventId) dailyReminderTimeMutation.mutate({ eventId: dailyReminderEventId, time: trimmed })
          }}
        />
      ) : null}

      {settingsOpen ? (
        <BudgetSettingsSheet token={token} budget={detail} onClose={() => setSettingsOpen(false)} />
      ) : null}

      {exportOpen ? (
        <ExportDataSheet
          token={token}
          initialBudgetId={budgetId}
          initialFrom={periodFrom}
          initialTo={periodTo}
          onClose={() => setExportOpen(false)}
        />
      ) : null}

      {addOpen ? (
        <AddTransactionSheet
          token={token}
          budgetId={budgetId}
          currencyCode={currencyCode}
          defaultDate={todayUtc}
          onClose={() => setAddOpen(false)}
          onSaved={async () => {
            setAddOpen(false)
            await invalidateBudgetQueries(queryClient, budgetId, periodFrom, periodTo)
          }}
        />
      ) : null}

      {editingTransaction ? (
        <AddTransactionSheet
          token={token}
          budgetId={budgetId}
          currencyCode={currencyCode}
          defaultDate={todayUtc}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSaved={async () => {
            setEditingTransaction(null)
            await invalidateBudgetQueries(queryClient, budgetId, periodFrom, periodTo)
          }}
        />
      ) : null}

      {categoryDrilldown ? (
        <CategoryTransactionsSheet
          token={token}
          budgetId={budgetId}
          category={categoryDrilldown}
          monthLabel={monthLabel}
          currencyCode={currencyCode}
          periodFrom={periodFrom}
          periodTo={periodTo}
          todayUtc={todayUtc}
          yesterdayUtc={yesterdayUtc}
          deletingTransactionIds={deletingTransactionIds}
          onClose={() => setCategoryDrilldown(null)}
          onDeleteTransaction={(transactionId) => deleteTransactionMutation.mutate({ transactionId })}
          onEditTransaction={(row) => {
            setCategoryDrilldown(null)
            setEditingTransaction(row)
          }}
        />
      ) : null}
    </div>
  )
}

function TransactionRow({
  row,
  currencyCode,
  onPress,
}: {
  row: FinanceTransactionResponse
  currencyCode: string
  onPress?: () => void
}) {
  const { locale, language } = useI18n()
  const emoji =
    row.categoryId || row.categoryName || row.categoryIconKey
      ? financeCategoryEmoji({
          iconKey: row.categoryIconKey ?? null,
          name: row.categoryName ?? null,
          type: row.type ?? null,
        })
      : iconKeyToEmoji(row.accountIconKey ?? null) ?? '🏦'
  const title = (row.title ?? '').trim() || '—'
  const txType = row.type === 'Income' ? 'Income' : 'Expense'
  const rawCategoryName = (row.categoryName ?? '').trim()
  const subtitle = (
    rawCategoryName
      ? getFinanceCategoryDisplayName({ type: txType, iconKey: row.categoryIconKey ?? null, name: rawCategoryName, language })
      : (row.accountName ?? '')
  ).trim()

  const value = signedAmount(row)
  const isIncome = value > 0

  const isInteractive = Boolean(onPress)

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-1 px-4 text-left shadow-sm transition ${isInteractive ? 'hover:bg-sand-light' : ''}`}
      onClick={onPress}
      disabled={!isInteractive}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-2xl">
          {emoji ? <span aria-hidden="true">{emoji}</span> : <span className="text-charcoal">{safeInitial(title)}</span>}
        </div>

        <div className="min-w-0">
          <div className="truncate font-bold text-charcoal">{title}</div>
          <div className="truncate text-sm font-semibold text-sage-dark">{subtitle || '—'}</div>
        </div>
      </div>

      <div
        className={
          isIncome
            ? 'rounded-xl bg-green-100 px-3 py-1.5 font-bold text-green-700'
            : 'font-bold text-forest'
        }
      >
        {formatCurrency(value, currencyCode, locale)}
      </div>
    </button>
  )
}

type SummaryTone = 'expense' | 'income'

type SummaryListItem = {
  id: string
  left: ReactNode
  label: string
  subtitle: string
  amount: number
  onPress?: () => void
}

const AVATAR_COLOR_CLASSES = [
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-slate-200 text-slate-700',
] as const

function SummaryListSection({
  tone,
  currencyCode,
  isLoading,
  isError,
  error,
  onRetry,
  items,
}: {
  tone: SummaryTone
  currencyCode: string
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  items: SummaryListItem[]
}) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (isError) {
    return <InlineQueryError title={t('budget.page.error.summary')} error={error} onRetry={onRetry} />
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70">
        {t('budget.summary.emptyPeriod')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <SummaryRowCard key={item.id} tone={tone} currencyCode={currencyCode} item={item} />
      ))}
    </div>
  )
}

function SummaryRowCard({
  item,
  tone,
  currencyCode,
}: {
  item: SummaryListItem
  tone: SummaryTone
  currencyCode: string
}) {
  const { locale } = useI18n()
  const amountClass =
    tone === 'income'
      ? 'rounded-xl bg-green-100 px-3 py-1.5 font-bold text-green-700'
      : 'font-bold text-charcoal'

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-4">
        {item.left}

        <div className="min-w-0">
          <div className="truncate font-bold text-forest">{item.label}</div>
          <div className="truncate text-sm font-bold text-sage-dark">{item.subtitle}</div>
        </div>
      </div>

      <div className={amountClass}>{formatCurrency(item.amount, currencyCode, locale)}</div>
    </>
  )

  if (item.onPress) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-2 px-4 text-left transition hover:bg-sand-light"
        onClick={item.onPress}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-2 px-4 bg-white">
      {content}
    </div>
  )
}

function mapCategoryItems(
  rows: CategorySummaryResponse[],
  options: {
    type: 'Expense' | 'Income'
    language: Language
    onSelect?: (next: CategoryDrilldown) => void
    t: TranslateFn
  } = { type: 'Expense', language: 'en', t: (k) => k },
): SummaryListItem[] {
  const noun = options.type === 'Income' ? options.t('budget.noun.income') : options.t('budget.noun.expenses')

  return rows
    .filter((r) => Boolean(r.categoryId))
    .map((r) => {
      const id = r.categoryId!
      const rawName = (r.categoryName ?? '').trim()
      const displayName =
        getFinanceCategoryDisplayName({
          type: options.type,
          iconKey: r.categoryIconKey ?? null,
          name: rawName,
          language: options.language,
        }) || rawName || '—'
      const emoji = financeCategoryEmoji({ iconKey: r.categoryIconKey ?? null, name: rawName || null, type: options.type })
      const pct = clamp(r.percentage ?? 0, 0, 100)
      const totalAbs = Math.abs(r.total ?? 0)

      return {
        id,
        left: emojiLeft(emoji),
        label: displayName,
        subtitle: options.t('budget.summary.percentOf', { pct: pct.toFixed(0), noun }),
        amount: totalAbs,
        onPress: options.onSelect
          ? () =>
              options.onSelect?.({
                categoryId: id,
                categoryName: displayName,
                categoryNameRaw: rawName || displayName,
                categoryIconKey: r.categoryIconKey ?? null,
                totalAbs,
                percentage: pct,
                type: options.type,
              })
          : undefined,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function CategoryTransactionsSheet({
  token,
  budgetId,
  category,
  monthLabel,
  currencyCode,
  periodFrom,
  periodTo,
  todayUtc,
  yesterdayUtc,
  deletingTransactionIds,
  onClose,
  onDeleteTransaction,
  onEditTransaction,
}: {
  token: string
  budgetId: string
  category: CategoryDrilldown
  monthLabel: string
  currencyCode: string
  periodFrom: string
  periodTo: string
  todayUtc: string
  yesterdayUtc: string
  deletingTransactionIds: Set<string>
  onClose: () => void
  onDeleteTransaction: (transactionId: string) => void
  onEditTransaction: (row: FinanceTransactionResponse) => void
}) {
  const { t, locale } = useI18n()
  const transactionsQuery = useQuery({
    queryKey: queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo }),
    queryFn: () => domusApi.getBudgetTransactions(token, budgetId, { from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId),
  })

  const rows = useMemo(() => {
    const wantType = category.type.toLowerCase()
    return (transactionsQuery.data ?? []).filter(
      (t) => t.categoryId === category.categoryId && (t.type ?? '').toLowerCase() === wantType,
    )
  }, [category.categoryId, category.type, transactionsQuery.data])

  const grouped = useMemo(() => groupTransactionsByDay(rows), [rows])

  const summary = useMemo(() => {
    const paid = rows.filter((t) => Boolean(t.isPaid))
    const paidTotalAbs = paid.reduce((acc, t) => acc + Math.abs(Number.isFinite(t.amount) ? (t.amount as number) : 0), 0)

    return { count: rows.length, paidCount: paid.length, paidTotalAbs }
  }, [rows])

  const noun = category.type === 'Income' ? t('budget.noun.income') : t('budget.noun.expenses')
  const emoji = financeCategoryEmoji({
    iconKey: category.categoryIconKey,
    name: category.categoryNameRaw || category.categoryName,
    type: category.type,
  })

  return (
    <div className="fixed inset-0 z-90">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl max-h-[92vh]">
        <div className="p-4 pb-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-full p-2 hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <i className="ri-close-line text-2xl text-gray-600" aria-hidden="true" />
            </button>

            <div className="text-base font-semibold text-charcoal">{t('common.category')}</div>

            <button
              type="button"
              className="rounded-full p-2 hover:bg-sand-light"
              aria-label={t('common.info')}
              title={t('common.info')}
              onClick={() => window.alert(t('common.comingSoon'))}
            >
              <i className="ri-information-line text-2xl text-gray-600" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="mb-6 rounded-3xl bg-sand-light p-5">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-white text-4xl">
              <span aria-hidden="true">{emoji}</span>
            </div>

            <div className="text-center">
              <div className="text-2xl font-extrabold text-charcoal">{category.categoryName}</div>
              <div className="mt-2 text-5xl font-extrabold text-charcoal">{formatCurrency(category.totalAbs, currencyCode, locale)}</div>

              <div className="mt-3 text-sm font-semibold text-gray-500">
                {t('budget.categoryDrilldown.countInMonth', { count: summary.count, month: monthLabel })}
              </div>
              <div className="text-sm font-semibold text-gray-400">
                {t('budget.categoryDrilldown.paidSummary', { count: summary.paidCount, total: formatCurrency(summary.paidTotalAbs, currencyCode, locale) })}
              </div>
              <div className="text-sm font-semibold text-gray-400">
                {t('budget.summary.percentOf', { pct: clamp(category.percentage, 0, 100).toFixed(0), noun })}
              </div>
            </div>
          </div>

          {transactionsQuery.isLoading ? (
            <div className="py-10 text-center">
              <LoadingSpinner />
            </div>
          ) : transactionsQuery.isError ? (
            <InlineQueryError title={t('budget.page.error.transactions')} error={transactionsQuery.error} onRetry={() => transactionsQuery.refetch()} />
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              {t('budget.categoryDrilldown.empty')}
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((g) => (
                <div key={g.date}>
                  <div className="mb-3 flex items-center justify-between text-sm font-extrabold text-gray-400">
                    <div>{formatDayLabel(g.date, todayUtc, yesterdayUtc, locale, t('common.today'), t('common.yesterday'))}</div>
                    <div className={g.total >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(g.total, currencyCode, locale)}</div>
                  </div>

                  <div className="space-y-3">
                    {g.rows.map((t, idx) => {
                      const key = t.id ?? `${g.date}-${idx}`
                      const transactionId = t.id
                      const canDelete = Boolean(transactionId) && !deletingTransactionIds.has(transactionId ?? '')

                      return (
                        <SwipeableRow
                          key={key}
                          className="rounded-2xl bg-red-50"
                          disabled={!canDelete}
                          threshold={108}
                          rightAction={
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
                              <i className="ri-delete-bin-6-line text-xl" aria-hidden="true" />
                            </div>
                          }
                          onSwipedLeft={
                            canDelete
                              ? () => {
                                  if (!transactionId) return
                                  onDeleteTransaction(transactionId)
                                }
                              : undefined
                          }
                        >
                          <TransactionRow row={t} currencyCode={currencyCode} onPress={() => onEditTransaction(t)} />
                        </SwipeableRow>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function mapMemberItems(
  rows: MemberSummaryResponse[],
  options: { tone: SummaryTone; members?: BudgetMemberResponse[]; locale: string; t: TranslateFn },
): SummaryListItem[] {
  const noun = options.tone === 'income' ? options.t('budget.noun.income') : options.t('budget.noun.expenses')
  const members = options.members ?? []

  const totalsById = new Map<string, MemberSummaryResponse>()
  for (const r of rows) {
    const id = r.userId
    if (!id) continue
    totalsById.set(id, r)
  }

  const mapped: SummaryListItem[] = []
  const seen = new Set<string>()

  for (const m of members) {
    const id = m.userId
    if (!id || seen.has(id)) continue
    seen.add(id)

    const row = totalsById.get(id) ?? null
    const name = (row?.name ?? m.name ?? '').trim() || '—'
    const pct = clamp(row?.percentage ?? 0, 0, 100)

    mapped.push({
      id,
      left: avatarLeft(safeAvatarText(name), pickAvatarClass(id)),
      label: name,
      subtitle: options.t('budget.summary.percentOf', { pct: pct.toFixed(0), noun }),
      amount: Math.abs(row?.total ?? 0),
    })
  }

  for (const [id, row] of totalsById.entries()) {
    if (seen.has(id)) continue
    const name = (row.name ?? '').trim() || '—'
    const pct = clamp(row.percentage ?? 0, 0, 100)

    mapped.push({
      id,
      left: avatarLeft(safeAvatarText(name), pickAvatarClass(id)),
      label: name,
      subtitle: options.t('budget.summary.percentOf', { pct: pct.toFixed(0), noun }),
      amount: Math.abs(row.total ?? 0),
    })
  }

  const collator = new Intl.Collator(options.locale)
  return mapped.sort((a, b) => b.amount - a.amount || collator.compare(a.label, b.label))
}

function mapAccountItems(
  rows: AccountSummaryResponse[],
  options: { tone: SummaryTone; accounts?: FinanceAccountResponse[]; financeAccountsById: Map<string, FinanceAccountResponse>; locale: string; t: TranslateFn },
): SummaryListItem[] {
  const noun = options.tone === 'income' ? options.t('budget.noun.income') : options.t('budget.noun.expenses')
  const accounts = options.accounts ?? []

  const totalsById = new Map<string, AccountSummaryResponse>()
  for (const r of rows) {
    const id = r.accountId
    if (!id) continue
    totalsById.set(id, r)
  }

  const mapped: SummaryListItem[] = []
  const seen = new Set<string>()

  for (const a of accounts) {
    const id = a.id
    if (!id || seen.has(id)) continue
    seen.add(id)

    const row = totalsById.get(id) ?? null
    const name = (row?.name ?? a.name ?? '').trim() || '—'
    const pct = clamp(row?.percentage ?? 0, 0, 100)
    const meta = options.financeAccountsById.get(id) ?? a
    const emoji = iconKeyToEmoji(meta?.iconKey ?? null) ?? '🏦'

    mapped.push({
      id,
      left: emojiLeft(emoji),
      label: name,
      subtitle: options.t('budget.summary.percentOf', { pct: pct.toFixed(0), noun }),
      amount: Math.abs(row?.total ?? 0),
    })
  }

  for (const [id, row] of totalsById.entries()) {
    if (seen.has(id)) continue

    const name = (row.name ?? '').trim() || '—'
    const pct = clamp(row.percentage ?? 0, 0, 100)
    const meta = options.financeAccountsById.get(id) ?? null
    const emoji = iconKeyToEmoji(meta?.iconKey ?? null) ?? '🏦'

    mapped.push({
      id,
      left: emojiLeft(emoji),
      label: name,
      subtitle: options.t('budget.summary.percentOf', { pct: pct.toFixed(0), noun }),
      amount: Math.abs(row.total ?? 0),
    })
  }

  const collator = new Intl.Collator(options.locale)
  return mapped.sort((a, b) => b.amount - a.amount || collator.compare(a.label, b.label))
}

function emojiLeft(emoji: string): ReactNode {
  return (
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full">
      <span aria-hidden="true">{emoji}</span>
    </div>
  )
}

function avatarLeft(text: string, className: string): ReactNode {
  return (
    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${className}`}>
      <span aria-hidden="true">{text}</span>
    </div>
  )
}

function safeAvatarText(name: string): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  const chars = Array.from(trimmed)
  if (chars.length === 1) return chars[0]!.toLocaleUpperCase()
  return `${chars[0]!.toLocaleUpperCase()}${chars[1]!.toLocaleLowerCase()}`
}

function pickAvatarClass(seed: string): string {
  const key = (seed ?? '').trim() || 'seed'
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  const idx = hash % AVATAR_COLOR_CLASSES.length
  return AVATAR_COLOR_CLASSES[idx] ?? AVATAR_COLOR_CLASSES[0]
}

function InlineQueryError({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
  const apiError = error instanceof ApiError ? error : null
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-700">
      <div className="font-semibold">{title}</div>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
        {apiError ? JSON.stringify(apiError.body, null, 2) : String(error)}
      </pre>
      <button type="button" className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700" onClick={onRetry}>
        {t('common.tryAgain')}
      </button>
    </div>
  )
}

function groupTransactionsByDay(rows: FinanceTransactionResponse[]): Array<{ date: string; total: number; rows: FinanceTransactionResponse[] }> {
  const out: Array<{ date: string; total: number; rows: FinanceTransactionResponse[] }> = []
  const byDate = new Map<string, { date: string; total: number; rows: FinanceTransactionResponse[] }>()

  for (const t of rows) {
    const date = (t.date ?? '').trim()
    if (!date) continue

    let group = byDate.get(date)
    if (!group) {
      group = { date, total: 0, rows: [] }
      byDate.set(date, group)
      out.push(group)
    }

    group.rows.push(t)
    group.total += signedAmount(t)
  }

  return out
}

function formatDayLabel(dateUtc: string, todayUtc: string, yesterdayUtc: string, locale: string, todayLabel: string, yesterdayLabel: string): string {
  if (dateUtc === todayUtc) return todayLabel
  if (dateUtc === yesterdayUtc) return yesterdayLabel

  const d = new Date(`${dateUtc}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateUtc
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function signedAmount(t: FinanceTransactionResponse): number {
  const raw = Number.isFinite(t.amount) ? (t.amount as number) : 0
  const abs = Math.abs(raw)
  const kind = (t.type ?? '').toLowerCase()
  if (kind === 'income') return abs
  if (kind === 'expense') return -abs
  return raw
}

function getUpcomingSummary(rows: FinanceTransactionResponse[], todayUtc: string): { count: number; total: number } {
  const future = rows.filter((t) => Boolean(t.date) && (t.date ?? '') > todayUtc)
  const count = future.length
  const total = future.reduce((acc, t) => acc + signedAmount(t), 0)
  return { count, total }
}

function nextIndicator(current: IndicatorId): IndicatorId {
  const idx = INDICATOR_CYCLE.indexOf(current)
  const safeIdx = idx >= 0 ? idx : 0
  const next = (safeIdx + 1) % INDICATOR_CYCLE.length
  return INDICATOR_CYCLE[next] ?? 'Balance'
}

function pickIndicatorFromMainIndicator(raw: string | null | undefined): IndicatorId | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  if (trimmed === 'Balance') return 'Balance'
  if (trimmed === 'BalanceToday') return 'BalanceToday'
  if (trimmed === 'TotalIncome') return 'TotalIncome'
  if (trimmed === 'TotalExpenses') return 'TotalExpenses'
  return null
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function utcDateKey(year: number, monthIndex0: number, day: number): string {
  const d = new Date(Date.UTC(year, monthIndex0, day, 12, 0, 0, 0))
  return d.toISOString().slice(0, 10)
}

function utcMonthRange(year: number, monthIndex0: number): { from: string; to: string } {
  const from = utcDateKey(year, monthIndex0, 1)
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 12, 0, 0, 0))
  return { from, to: end.toISOString().slice(0, 10) }
}

function addMonths(cursor: { year: number; monthIndex0: number }, delta: number): { year: number; monthIndex0: number } {
  const base = cursor.year * 12 + cursor.monthIndex0
  const next = base + delta
  const year = Math.floor(next / 12)
  const monthIndex0 = next % 12
  return { year, monthIndex0: monthIndex0 < 0 ? monthIndex0 + 12 : monthIndex0 }
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function parseHm(raw: string): { hours: number; minutes: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec((raw ?? '').trim())
  if (!m) return null
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

async function invalidateBudgetQueries(
  queryClient: QueryClient,
  budgetId: string,
  from: string,
  to: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['budgetTotals', budgetId] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetTransactions({ budgetId, from, to }) }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryCategories', budgetId] }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryMembers', budgetId] }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryAccounts', budgetId] }),
  ])
}
