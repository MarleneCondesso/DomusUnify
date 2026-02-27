import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  domusApi,
  type AccountSummaryResponse,
  type CategorySummaryResponse,
  type FamilyResponse,
  type FinanceAccountResponse,
  type FinanceTransactionResponse,
  type MemberSummaryResponse,
} from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { AddTransactionSheet } from './AddTransactionSheet'
import { BudgetOptionsSheet } from './BudgetOptionsSheet'
import { BudgetSettingsSheet } from './BudgetSettingsSheet'
import { BudgetSwitcherSheet } from './BudgetSwitcherSheet'
import { CreateBudgetSheet } from './CreateBudgetSheet'
import { ExportDataSheet } from './ExportDataSheet'
import { NotificationsSheet } from './NotificationsSheet'

type Props = {
  token: string
  family: FamilyResponse
}

type TabId = 'list' | 'categories' | 'members' | 'accounts'
type IndicatorId = 'Balance' | 'TotalExpenses' | 'TotalIncome' | 'BalanceToday'

const TAB_DEFS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'list', label: 'Lista', icon: 'ri-file-list-3-line' },
  { id: 'categories', label: 'Categorias', icon: 'ri-folder-3-line' },
  { id: 'members', label: 'Membros', icon: 'ri-user-3-line' },
  { id: 'accounts', label: 'Contas', icon: 'ri-bank-card-line' },
]

const INDICATOR_OPTIONS: Array<{ id: IndicatorId; label: string; icon: string; subtitle: string }> = [
  { id: 'Balance', label: 'Saldo do mês', icon: 'ri-money-euro-circle-line', subtitle: 'Saldo do mês' },
  { id: 'BalanceToday', label: 'Saldo de hoje', icon: 'ri-calendar-check-line', subtitle: 'Saldo de hoje' },
  { id: 'TotalExpenses', label: 'Despesas este mês', icon: 'ri-arrow-right-down-line', subtitle: 'Despesas este mês' },
  { id: 'TotalIncome', label: 'Renda este mês', icon: 'ri-arrow-left-up-line', subtitle: 'Renda este mês' },
]

const INDICATOR_CYCLE: IndicatorId[] = ['Balance', 'BalanceToday', 'TotalExpenses', 'TotalIncome']

export function BudgetPage({ token }: Props) {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const referenceDate = useMemo(() => utcDateKey(cursor.year, cursor.monthIndex0, 15), [cursor.monthIndex0, cursor.year])
  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const yesterdayUtc = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10), [])

  const detailQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetById(budgetId) : ['budgetById', null],
    queryFn: () => domusApi.getBudgetById(token, budgetId!),
    enabled: Boolean(budgetId),
  })

  const totalsQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetTotals({ budgetId, referenceDate }) : ['budgetTotals', null, referenceDate],
    queryFn: () => domusApi.getBudgetTotals(token, budgetId!, referenceDate),
    enabled: Boolean(budgetId),
  })

  const currencyCode = (detailQuery.data?.currencyCode ?? 'EUR') || 'EUR'

  const periodFrom = totalsQuery.data?.periodStart ?? referenceDate
  const periodTo = totalsQuery.data?.periodEnd ?? referenceDate

  const transactionsQuery = useQuery({
    queryKey: budgetId ? queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo }) : ['budgetTransactions', null],
    queryFn: () => domusApi.getBudgetTransactions(token, budgetId!, { from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'list',
  })

  const categoriesExpensesQuery = useQuery({
    queryKey: budgetId
      ? queryKeys.budgetSummaryCategories({ budgetId, type: 'Expense', from: periodFrom, to: periodTo })
      : ['budgetSummaryCategories', null],
    queryFn: () =>
      domusApi.getBudgetSummaryByCategories(token, budgetId!, { type: 'Expense', from: periodFrom, to: periodTo }),
    enabled: Boolean(budgetId) && tab === 'categories',
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

  const financeAccountsQuery = useQuery({
    queryKey: queryKeys.financeAccounts,
    queryFn: () => domusApi.getFinanceAccounts(token),
    enabled: tab === 'accounts',
  })

  const clearMutation = useMutation({
    mutationFn: () => domusApi.clearBudgetTransactions(token, budgetId!),
    onSuccess: async () => {
      await invalidateBudgetQueries(queryClient, budgetId!, periodFrom, periodTo, referenceDate)
    },
  })

  const financeAccountsById = useMemo(() => {
    const map = new Map<string, FinanceAccountResponse>()

    for (const a of financeAccountsQuery.data ?? []) {
      if (!a?.id) continue
      map.set(a.id, a)
    }

    return map
  }, [financeAccountsQuery.data])

  const indicatorDef = INDICATOR_OPTIONS.find((x) => x.id === indicator) ?? INDICATOR_OPTIONS[0]!

  const indicatorValue = useMemo(() => {
    const t = totalsQuery.data
    if (!t) return 0
    switch (indicator) {
      case 'TotalExpenses':
        return Math.abs(t.expensesThisPeriod ?? 0)
      case 'TotalIncome':
        return Math.abs(t.incomeThisPeriod ?? 0)
      case 'BalanceToday':
        return t.balanceToday ?? 0
      case 'Balance':
      default:
        return t.balanceThisPeriod ?? 0
    }
  }, [indicator, totalsQuery.data])

  useEffect(() => {
    setTab('list')
    setIndicator('Balance')
    setBudgetSwitcherOpen(false)
    setCreateBudgetOpen(false)
    setOptionsOpen(false)
    setSettingsOpen(false)
    setNotificationsOpen(false)
    setExportOpen(false)
    setAddOpen(false)
  }, [budgetId])

  useEffect(() => {
    const derived = pickIndicatorFromMainIndicator(detailQuery.data?.mainIndicator ?? null)
    if (derived) setIndicator(derived)
  }, [budgetId, detailQuery.data?.mainIndicator])

  const monthLabel = useMemo(() => {
    const d = new Date(cursor.year, cursor.monthIndex0, 1)
    const raw = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
    return capitalizeFirst(raw)
  }, [cursor.monthIndex0, cursor.year])

  const apiDetailError = detailQuery.error instanceof ApiError ? detailQuery.error : null
  const apiTotalsError = totalsQuery.error instanceof ApiError ? totalsQuery.error : null

  if (!budgetId) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">Orçamento inválido</h2>
        <p className="mt-2 text-sm text-charcoal">Falta o identificador do orçamento na rota.</p>
      </div>
    )
  }

  if (detailQuery.isLoading || totalsQuery.isLoading) {
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
        title="Erro ao obter orçamento"
      />
    )
  }

  if (totalsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiTotalsError}
        queryKey={queryKeys.budgetTotals({ budgetId, referenceDate })}
        queryClient={queryClient}
        title="Erro ao obter totais do orçamento"
      />
    )
  }

  const detail = detailQuery.data!

  const allTransactions = transactionsQuery.data ?? []
  const upcoming = getUpcomingSummary(allTransactions, todayUtc)
  const upcomingDisplayMode = (detail.upcomingDisplayMode ?? 'Expanded') || 'Expanded'
  const visibleTransactions =
    upcomingDisplayMode === 'Collapsed'
      ? allTransactions.filter((t) => Boolean(t.date) && (t.date ?? '') <= todayUtc)
      : allTransactions
  const groups = groupTransactionsByDay(visibleTransactions)

  return (
    <div className="min-h-screen w-full bg-offwhite pb-24">
      <header className="bg-linear-to-b from-blue-500 to-offwhite pt-8">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 hover:bg-white text-blue-700"
            aria-label="Home"
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 hover:bg-white text-blue-700 disabled:opacity-60"
            aria-label="Menu"
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
          <div className="w-full rounded-3xl bg-blue-600/70 p-6 text-left text-white shadow-lg backdrop-blur">
            <button
              type="button"
              className="mb-3 flex w-full items-center gap-3 text-lg font-semibold hover:opacity-95"
              onClick={() => setBudgetSwitcherOpen(true)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/20 text-xl" aria-hidden="true">
                {iconKeyToEmoji(detail.iconKey ?? null) ?? '💰'}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{detail.name ?? 'Orçamento'}</span>
                <i className="ri-arrow-down-s-line text-2xl opacity-90" aria-hidden="true" />
              </span>
            </button>

            <button
              type="button"
              className="block w-full text-left hover:opacity-95"
              onClick={() => setIndicator((prev) => nextIndicator(prev))}
              aria-label="Mudar total"
            >
              <div className="text-6xl font-bold leading-none">{formatCurrency(indicatorValue, currencyCode)}</div>
              <div className="mt-3 text-xl font-semibold text-white/90">{indicatorDef.subtitle}</div>
            </button>
          </div>
        </section>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4">
        <section className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-white"
            aria-label="Mês anterior"
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            <i className="ri-arrow-left-s-line text-3xl leading-none" />
          </button>

          <div className="flex items-center gap-2 text-xl font-extrabold text-charcoal">
            <i className="ri-calendar-2-line text-xl" />
            <span>{monthLabel}</span>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-white"
            aria-label="Próximo mês"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <i className="ri-arrow-right-s-line text-3xl leading-none" />
          </button>
        </section>

        <section className="mb-5 flex items-center gap-3 overflow-x-auto pb-1">
          {TAB_DEFS.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-transparent bg-blue-100 text-blue-700'
                    : 'border-gray-200 bg-white text-charcoal hover:bg-sand-light'
                }`}
                onClick={() => setTab(t.id)}
              >
                <i className={`${t.icon} text-xl`} />
                {t.label}
              </button>
            )
          })}
        </section>

        {tab === 'list' ? (
          <section>
            <div className="mb-4 flex items-center justify-between text-lg font-bold text-blue-500">
              <div>{upcoming.count} transação próxima</div>
              <div>{formatCurrency(upcoming.total, currencyCode)}</div>
            </div>

            {transactionsQuery.isLoading ? (
              <div className="py-10 text-center">
                <LoadingSpinner />
              </div>
            ) : transactionsQuery.isError ? (
              <InlineQueryError
                title="Erro ao obter transações"
                error={transactionsQuery.error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: queryKeys.budgetTransactions({ budgetId, from: periodFrom, to: periodTo }) })}
              />
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70">
                Sem transações neste período.
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.date}>
                    <div className="mb-3 flex items-center justify-between text-2xl font-extrabold text-gray-400">
                      <div>{formatDayLabel(g.date, todayUtc, yesterdayUtc)}</div>
                      <div className="text-xl">{formatCurrency(g.total, currencyCode)}</div>
                    </div>

                    <div className="space-y-3">
                      {g.rows.map((t, idx) => (
                        <TransactionRow
                          key={t.id ?? `${g.date}-${idx}`}
                          row={t}
                          currencyCode={currencyCode}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'categories' ? (
          <section>
            <div className="mb-3 text-lg font-extrabold text-gray-400">Despesas por categoria</div>
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
              items={mapCategoryItems(categoriesExpensesQuery.data ?? [])}
            />
          </section>
        ) : null}

        {tab === 'members' ? (
          <section className="space-y-8">
            <div>
              <div className="mb-3 text-lg font-extrabold text-gray-400">Despesas por membro</div>
              <SummaryListSection
                tone="expense"
                currencyCode={currencyCode}
                isLoading={membersExpensesQuery.isLoading}
                isError={membersExpensesQuery.isError}
                error={membersExpensesQuery.error}
                onRetry={() =>
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryMembers({ budgetId, type: 'Expense', from: periodFrom, to: periodTo }),
                  })
                }
                items={mapMemberItems(membersExpensesQuery.data ?? [], { tone: 'expense' })}
              />
            </div>

            <div>
              <div className="mb-3 text-lg font-extrabold text-gray-400">Renda por membro</div>
              <SummaryListSection
                tone="income"
                currencyCode={currencyCode}
                isLoading={membersIncomeQuery.isLoading}
                isError={membersIncomeQuery.isError}
                error={membersIncomeQuery.error}
                onRetry={() =>
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryMembers({ budgetId, type: 'Income', from: periodFrom, to: periodTo }),
                  })
                }
                items={mapMemberItems(membersIncomeQuery.data ?? [], { tone: 'income' })}
              />
            </div>
          </section>
        ) : null}

        {tab === 'accounts' ? (
          <section className="space-y-8">
            <div>
              <div className="mb-3 text-lg font-extrabold text-gray-400">Despesas por conta</div>
              <SummaryListSection
                tone="expense"
                currencyCode={currencyCode}
                isLoading={accountsExpensesQuery.isLoading || financeAccountsQuery.isLoading}
                isError={accountsExpensesQuery.isError || financeAccountsQuery.isError}
                error={accountsExpensesQuery.error || financeAccountsQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryAccounts({ budgetId, type: 'Expense', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.financeAccounts })
                }}
                items={mapAccountItems(accountsExpensesQuery.data ?? [], { tone: 'expense', financeAccountsById })}
              />
            </div>

            <div>
              <div className="mb-3 text-lg font-extrabold text-gray-400">Receita por conta</div>
              <SummaryListSection
                tone="income"
                currencyCode={currencyCode}
                isLoading={accountsIncomeQuery.isLoading || financeAccountsQuery.isLoading}
                isError={accountsIncomeQuery.isError || financeAccountsQuery.isError}
                error={accountsIncomeQuery.error || financeAccountsQuery.error}
                onRetry={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.budgetSummaryAccounts({ budgetId, type: 'Income', from: periodFrom, to: periodTo }),
                  })
                  queryClient.invalidateQueries({ queryKey: queryKeys.financeAccounts })
                }}
                items={mapAccountItems(accountsIncomeQuery.data ?? [], { tone: 'income', financeAccountsById })}
              />
            </div>
          </section>
        ) : null}
      </main>

      <button
        type="button"
        className="fixed bottom-20 right-6 grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-white shadow-2xl hover:bg-blue-600"
        aria-label="Adicionar transação"
        onClick={() => setAddOpen(true)}
      >
        <i className="ri-add-line text-3xl leading-none" />
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
          onOpenNotifications={() => {
            setOptionsOpen(false)
            setNotificationsOpen(true)
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
            const ok = window.confirm('Tem a certeza? Esta ação remove todas as transações do orçamento.')
            if (!ok) return
            clearMutation.mutate()
          }}
        />
      ) : null}

      {settingsOpen ? (
        <BudgetSettingsSheet token={token} budget={detail} onClose={() => setSettingsOpen(false)} />
      ) : null}

      {notificationsOpen ? <NotificationsSheet token={token} onClose={() => setNotificationsOpen(false)} /> : null}

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
          onCreated={async () => {
            setAddOpen(false)
            await invalidateBudgetQueries(queryClient, budgetId, periodFrom, periodTo, referenceDate)
          }}
        />
      ) : null}
    </div>
  )
}

function TransactionRow({ row, currencyCode }: { row: FinanceTransactionResponse; currencyCode: string }) {
  const emoji = iconKeyToEmoji(row.categoryIconKey ?? row.accountIconKey ?? null)
  const title = (row.title ?? '').trim() || '—'
  const subtitle = (row.categoryName ?? row.accountName ?? '').trim()

  const value = signedAmount(row)
  const isIncome = value > 0

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sand-light text-2xl">
          {emoji ? <span aria-hidden="true">{emoji}</span> : <span className="text-lg font-bold text-charcoal">{safeInitial(title)}</span>}
        </div>

        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold text-charcoal">{title}</div>
          <div className="truncate text-sm font-semibold text-gray-400">{subtitle || '—'}</div>
        </div>
      </div>

      <div
        className={
          isIncome
            ? 'rounded-xl bg-green-100 px-3 py-1.5 text-lg font-extrabold text-green-700'
            : 'text-lg font-extrabold text-charcoal'
        }
      >
        {formatCurrency(value, currencyCode)}
      </div>
    </div>
  )
}

type SummaryTone = 'expense' | 'income'

type SummaryListItem = {
  id: string
  left: ReactNode
  label: string
  subtitle: string
  amount: number
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
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (isError) {
    return <InlineQueryError title="Erro ao obter resumo" error={error} onRetry={onRetry} />
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70">
        Sem dados neste período.
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
  const amountClass =
    tone === 'income'
      ? 'rounded-xl bg-green-100 px-3 py-1.5 text-lg font-extrabold text-green-700'
      : 'text-lg font-extrabold text-charcoal'

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        {item.left}

        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold text-charcoal">{item.label}</div>
          <div className="truncate text-sm font-semibold text-gray-400">{item.subtitle}</div>
        </div>
      </div>

      <div className={amountClass}>{formatCurrency(item.amount, currencyCode)}</div>
    </div>
  )
}

function mapCategoryItems(rows: CategorySummaryResponse[]): SummaryListItem[] {
  return rows
    .filter((r) => Boolean(r.categoryId))
    .map((r) => {
      const id = r.categoryId!
      const name = (r.categoryName ?? '').trim() || '—'
      const emoji = iconKeyToEmoji(r.categoryIconKey ?? null) ?? '🏷️'
      const pct = clamp(r.percentage ?? 0, 0, 100)

      return {
        id,
        left: emojiLeft(emoji),
        label: name,
        subtitle: `${pct.toFixed(0)}% de despesas`,
        amount: Math.abs(r.total ?? 0),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function mapMemberItems(rows: MemberSummaryResponse[], options: { tone: SummaryTone }): SummaryListItem[] {
  const noun = options.tone === 'income' ? 'renda' : 'despesas'

  return rows
    .filter((r) => Boolean(r.userId))
    .map((r) => {
      const id = r.userId!
      const name = (r.name ?? '').trim() || '—'
      const pct = clamp(r.percentage ?? 0, 0, 100)

      return {
        id,
        left: avatarLeft(safeAvatarText(name), pickAvatarClass(id)),
        label: name,
        subtitle: `${pct.toFixed(0)}% de ${noun}`,
        amount: Math.abs(r.total ?? 0),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function mapAccountItems(
  rows: AccountSummaryResponse[],
  options: { tone: SummaryTone; financeAccountsById: Map<string, FinanceAccountResponse> },
): SummaryListItem[] {
  const noun = options.tone === 'income' ? 'renda' : 'despesas'

  return rows
    .filter((r) => Boolean(r.accountId))
    .map((r) => {
      const id = r.accountId!
      const name = (r.name ?? '').trim() || '—'
      const pct = clamp(r.percentage ?? 0, 0, 100)
      const meta = options.financeAccountsById.get(id) ?? null
      const emoji = iconKeyToEmoji(meta?.iconKey ?? null) ?? '🏦'

      return {
        id,
        left: emojiLeft(emoji),
        label: name,
        subtitle: `${pct.toFixed(0)}% de ${noun}`,
        amount: Math.abs(r.total ?? 0),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function emojiLeft(emoji: string): ReactNode {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand-light text-2xl">
      <span aria-hidden="true">{emoji}</span>
    </div>
  )
}

function avatarLeft(text: string, className: string): ReactNode {
  return (
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold ${className}`}>
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

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-700">
      <div className="font-semibold">{title}</div>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
        {apiError ? JSON.stringify(apiError.body, null, 2) : String(error)}
      </pre>
      <button type="button" className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700" onClick={onRetry}>
        Tentar novamente
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

function formatDayLabel(dateUtc: string, todayUtc: string, yesterdayUtc: string): string {
  if (dateUtc === todayUtc) return 'Hoje'
  if (dateUtc === yesterdayUtc) return 'Ontem'

  const d = new Date(`${dateUtc}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateUtc
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
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

function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const code = (currencyCode || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: code }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${code}`
  }
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function capitalizeFirst(s: string): string {
  const trimmed = (s ?? '').trim()
  return trimmed ? trimmed[0]!.toLocaleUpperCase() + trimmed.slice(1) : trimmed
}

function utcDateKey(year: number, monthIndex0: number, day: number): string {
  const d = new Date(Date.UTC(year, monthIndex0, day, 12, 0, 0, 0))
  return d.toISOString().slice(0, 10)
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

async function invalidateBudgetQueries(
  queryClient: QueryClient,
  budgetId: string,
  from: string,
  to: string,
  referenceDate: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetTotals({ budgetId, referenceDate }) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetTransactions({ budgetId, from, to }) }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryCategories', budgetId] }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryMembers', budgetId] }),
    queryClient.invalidateQueries({ queryKey: ['budgetSummaryAccounts', budgetId] }),
  ])
}
