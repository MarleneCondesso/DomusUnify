import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { domusApi, type ActivityEntryResponse, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'

type DashboardPageProps = {
  token: string
  family: FamilyResponse
}

export function DashboardPage({ family, token }: DashboardPageProps) {

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const currentUserId = useMemo(() => getUserIdFromAccessToken(token), [token])
  const calendarWindow = useMemo(() => {
    const from = new Date()
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)
    return { fromUtc: from.toISOString(), toUtc: to.toISOString() }
  }, [])

  // Query keys that depend on parameters should be memoized to avoid refetching.
  const listUpdatesTodayKey = queryKeys.activityAll({ skip: 0, take: 200, type: 'lists', dateUtc: todayUtc })
  const recentUpdatesKey = queryKeys.activityRecent(4)
  const nextScheduleKey = queryKeys.calendarEvents({
    fromUtc: calendarWindow.fromUtc,
    toUtc: calendarWindow.toUtc,
    participantUserId: currentUserId ?? undefined,
    take: 1,
  })
  //#endregion

  //#region ...[Queries]...

  //#region ...[Family]...
  // Family Query - para mostrar o número de membros e validar o acesso ao hub SignalR.
  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })
  //#endregion

  //#region ...[Lists]...
  // Lists Query - para mostrar o número de listas 
  const listQuery = useQuery({
    queryKey: queryKeys.lists,
    queryFn: () => domusApi.getLists(token),
  })

  // Atividade de listas hoje, para mostrar quantas listas foram atualizadas hoje.
  const listUpdatesTodayQuery = useQuery({
    queryKey: listUpdatesTodayKey,
    queryFn: () => domusApi.getActivity(token, { type: 'lists', dateUtc: todayUtc, take: 200 }),
  })
  //#endregion

  //#region ...[Budgets]...
  // Budgets Query - para mostrar o progresso do orçamento
  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: () => domusApi.getBudgets(token),
  })

  // O "orçamento principal" é o que tem tipo "recurring". Se não houver nenhum com esse tipo, escolhemos o primeiro. Se não houver nenhum orçamento, fica como null e as queries relacionadas ficam desativadas.
  const primaryBudgetId = useMemo(() => pickPrimaryBudgetId(budgetsQuery.data ?? []), [budgetsQuery.data])

  // Queries de detalhe do orçamento, só ativas se houver um orçamento principal.
  const budgetDetailQuery = useQuery({
    queryKey: primaryBudgetId ? queryKeys.budgetById(primaryBudgetId) : ['budgetById', null],
    queryFn: () => domusApi.getBudgetById(token, primaryBudgetId!),
    enabled: Boolean(primaryBudgetId),
  })

  // Query de totais do orçamento, só ativa se houver um orçamento principal.
  const budgetTotalsQuery = useQuery({
    queryKey: primaryBudgetId
      ? queryKeys.budgetTotals({ budgetId: primaryBudgetId, referenceDate: todayUtc })
      : ['budgetTotals', null, todayUtc],
    queryFn: () => domusApi.getBudgetTotals(token, primaryBudgetId!, todayUtc),
    enabled: Boolean(primaryBudgetId),
  })

  //#endregion

  //#region ...[Calendar]...

  // Próximo evento do calendário, para mostrar o próximo compromisso da família.
  const nextScheduleQuery = useQuery({
    queryKey: nextScheduleKey,
    queryFn: () =>
      domusApi.getCalendarEvents(
        token,
        calendarWindow.fromUtc,
        calendarWindow.toUtc,
        undefined,
        undefined,
        currentUserId ?? undefined,
        1,
      ),
  })
  //#endregion

  //#region ...[Atividade, notificações]...

  // Recent updates, para mostrar as últimas atividades da família (limitado a 4 para não sobrecarregar o dashboard).
  const recentUpdatesQuery = useQuery({
    queryKey: recentUpdatesKey,
    queryFn: () => domusApi.getRecentActivity(token, 4),
  })

  // Notificações por ler, para mostrar um resumo das notificações recentes.
  const unreadNotificationsQuery = useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => domusApi.getUnreadNotifications(token, 50),
  })

  //#endregion

  //#endregion

  //#region ...[Loading]...
  const isLoading =
    familyMembersQuery.isLoading ||
    listQuery.isLoading ||
    budgetsQuery.isLoading ||
    listUpdatesTodayQuery.isLoading ||
    recentUpdatesQuery.isLoading ||
    unreadNotificationsQuery.isLoading ||
    nextScheduleQuery.isLoading ||
    budgetDetailQuery.isLoading ||
    budgetTotalsQuery.isLoading

  //loading
  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  //#endregion

  //#region ...[Errors]...
  const apiFamilyError = familyMembersQuery.error instanceof ApiError ? familyMembersQuery.error : null
  const apiListsError = listQuery.error instanceof ApiError ? listQuery.error : null
  const apiBudgetsError = budgetsQuery.error instanceof ApiError ? budgetsQuery.error : null
  const apiBudgetDetailError = budgetDetailQuery.error instanceof ApiError ? budgetDetailQuery.error : null
  const apiBudgetTotalsError = budgetTotalsQuery.error instanceof ApiError ? budgetTotalsQuery.error : null
  const apiListUpdatesTodayError = listUpdatesTodayQuery.error instanceof ApiError ? listUpdatesTodayQuery.error : null
  const apiRecentUpdatesError = recentUpdatesQuery.error instanceof ApiError ? recentUpdatesQuery.error : null
  const apiUnreadNotificationsError = unreadNotificationsQuery.error instanceof ApiError ? unreadNotificationsQuery.error : null
  const apiNextScheduleError = nextScheduleQuery.error instanceof ApiError ? nextScheduleQuery.error : null

  //Validation Errors - cada um tem o seu, para não mostrar erros de queries que não falharam.
  if (familyMembersQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiFamilyError}
        queryKey={queryKeys.familyMembers}
        queryClient={queryClient}
        title="Erro ao obter membros da família"
      />
    )
  }

  if (listQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiListsError}
        queryKey={queryKeys.lists}
        queryClient={queryClient}
        title="Erro ao obter listas da família"
      />
    )
  }

  if (budgetsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiBudgetsError}
        queryKey={queryKeys.budgets}
        queryClient={queryClient}
        title="Erro ao obter orçamentos"
      />
    )
  }

  if (budgetDetailQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiBudgetDetailError}
        queryKey={primaryBudgetId ? queryKeys.budgetById(primaryBudgetId) : ['budgetById', null]}
        queryClient={queryClient}
        title="Erro ao obter orçamento"
      />
    )
  }

  if (budgetTotalsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiBudgetTotalsError}
        queryKey={
          primaryBudgetId
            ? queryKeys.budgetTotals({ budgetId: primaryBudgetId, referenceDate: todayUtc })
            : ['budgetTotals', null, todayUtc]
        }
        queryClient={queryClient}
        title="Erro ao obter totais do orçamento"
      />
    )
  }

  if (listUpdatesTodayQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiListUpdatesTodayError}
        queryKey={listUpdatesTodayKey}
        queryClient={queryClient}
        title="Erro ao obter atividade recente"
      />
    )
  }

  if (recentUpdatesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiRecentUpdatesError}
        queryKey={recentUpdatesKey}
        queryClient={queryClient}
        title="Erro ao obter recent updates"
      />
    )
  }

  if (unreadNotificationsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiUnreadNotificationsError}
        queryKey={queryKeys.notificationsUnread}
        queryClient={queryClient}
        title="Erro ao obter notificações"
      />
    )
  }

  if (nextScheduleQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiNextScheduleError}
        queryKey={nextScheduleKey}
        queryClient={queryClient}
        title="Erro ao obter próximo evento do calendário"
      />
    )
  }

  //#endregion

  //#region ...[Data processing]...

  const familyMembers = familyMembersQuery.data!

  const lists = listQuery.data!
  const listUpdatesToday = listUpdatesTodayQuery.data!

  const budgets = budgetsQuery.data ?? []

  const recentUpdates = recentUpdatesQuery.data!
  const unreadNotifications = unreadNotificationsQuery.data!
  const nextCalendarEvent =
    nextScheduleQuery.data && nextScheduleQuery.data.length > 0 ? nextScheduleQuery.data[0] : null

  const sharedPreviewMembers = getSharedPreviewMembers(lists, 3)
  const updatedListsTodayCount = countUniqueListUpdatesToday(listUpdatesToday)
  const unreadCount = unreadNotifications.length

  const primaryBudget = budgets.find((b) => Boolean(b.id) && b.id === primaryBudgetId) ?? null
  const budgetDetail = budgetDetailQuery.data
  const budgetTotals = budgetTotalsQuery.data

  const monthLabel = budgetTotals?.periodStart
    ? formatMonthYear(new Date(`${budgetTotals.periodStart}T00:00:00Z`))
    : formatMonthYear(new Date())

  const currencyCode = (budgetDetail?.currencyCode ?? primaryBudget?.currencyCode ?? 'EUR') || 'EUR'

  const incomeThisPeriod = budgetTotals?.incomeThisPeriod ?? 0
  const expensesThisPeriod = budgetTotals?.expensesThisPeriod ?? 0

  const totalBudget =
    budgetDetail?.spendingLimit && budgetDetail.spendingLimit > 0 ? budgetDetail.spendingLimit : incomeThisPeriod

  const hasBudget = Boolean(primaryBudgetId)
  const hasTotalBudget = hasBudget && totalBudget > 0

  const budgetProgressRaw = hasTotalBudget ? (expensesThisPeriod / totalBudget) * 100 : 0
  const budgetProgress = Math.max(0, Math.round(budgetProgressRaw))
  const budgetProgressBar = Math.max(0, Math.min(100, budgetProgressRaw))

  const remainingBudget = hasTotalBudget ? totalBudget - expensesThisPeriod : 0
  const monthlyBudgetTotal = hasBudget ? formatCurrency(remainingBudget, currencyCode) : '—'

  //#endregion

  return (
    <div className="min-h-screen bg-offwhite w-full p-0">

      {/** FAMILY */}
      <section className="bg-linear-to-b from-sage-light to-offwhite py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-forest/10 text-forest px-3 py-1.5 rounded-full text-xs font-medium">
              <i className="ri-vip-diamond-line"></i>
              <span>ACTIVE FAMILY</span>
            </div>
          </div>
          <h1 className="text-6xl font-serif font-medium text-forest mb-3">{family.name}</h1>
          <p className="text-lg text-charcoal/80 mb-6">
            {familyMembers.length} members · You are {family.role}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 -mt-12 pb-16 gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {/** LISTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-sage-light rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-6 ">
              {sharedPreviewMembers.map((member) => (
                <i
                  key={member.userId}
                  className="w-10 h-10 rounded-full border-2 border-white object-cover content-center text-center"
                >
                  {safeInitial(member.name)}
                </i>
              ))}
            </div>
            <div className="text-8xl font-serif font-medium text-forest mb-2">{lists.length}</div>
            <p className="text-xl font-semibold text-forest mb-1">Shared Lists</p>
            <p className="text-sm text-charcoal/80">{updatedListsTodayCount} updated today</p>
            <div className="flex justify-end">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <i
                    className="ri-arrow-right-up-line text-forest"
                    onClick={() => {
                      navigate('/lists')
                    }}
                  ></i>
              </div>
            </div>
          </div>
        </div>
        
      {/** CALENDAR */}
        <div className="bg-amber rounded-2xl p-8 text-white hover:shadow-2xl transition-all cursor-pointer">
          <span className="text-xs font-medium mb-4 opacity-90">UPCOMING</span>
          <h3 className="text-3xl font-bold mb-2">{nextCalendarEvent?.title ?? 'No upcoming events'}</h3>
          <p className="text-sm opacity-90 mb-4">
            {nextCalendarEvent?.startUtc ? formatUpcomingWhen(nextCalendarEvent.startUtc) : 'No events scheduled.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="border-2 border-white text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white hover:text-amber transition-all whitespace-nowrap cursor-pointer"
          >
            View Calendar
          </button>
        </div>


        <div className="bg-forest rounded-2xl p-8 text-white relative overflow-hidden hover:shadow-2xl transition-all cursor-pointer">
          <img
            src="https://readdy.ai/api/search-image?query=happy%20family%20enjoying%20time%20together%20in%20modern%20home%20warm%20atmosphere%20natural%20lighting%20lifestyle%20photography&width=400&height=500&seq=budget1&orientation=portrait"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-t from-forest via-forest/80 to-transparent"></div>
          <div className="relative z-10">
            <div className="text-xl font-semibold mb-4">{monthLabel[0].toLocaleUpperCase() + monthLabel.substring(1)}</div>
            <div className="mb-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-amber rounded-full"
                  style={{ width: `${budgetProgressBar}%` }}
                ></div>
              </div>
              <div className="text-sm opacity-90 font-semibold">{budgetProgress}% spent this month</div>
              <div className="text-4xl font-bold">{monthlyBudgetTotal}</div>
              <div className="text-sm opacity-90 font-semibold">remaining</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-8 hover:shadow-xl transition-all">
            <h3 className="text-2xl font-bold text-forest mb-6">Recent Updates</h3>
            <div className="space-y-4">
              {recentUpdates.length > 0 ? (
                recentUpdates.map((x) => (
                  <div
                    key={x.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <i className="w-8 h-8 rounded-full object-cover shrink-0 text-sage-dark border-sage-dark border content-center text-center">
                      {safeInitial(x.actorName)}
                    </i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-charcoal">
                        <strong className="font-semibold">{x.actorName}</strong> {x.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {x.createdAtUtc ? formatTimeAgo(x.createdAtUtc) : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No activity yet.</p>
              )}
            </div>
            <button className="mt-6 text-sm text-amber-dark hover:text-amber font-medium transition-colors cursor-pointer">
              View All Activity →
            </button>
          </div>
          <div className="space-y-6">
            <div className="bg-sand rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center h-40">
              <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center mb-3">
                <i className="ri-add-line text-2xl text-white"></i>
              </div>
              <div className="text-lg font-semibold text-forest">Quick Add Item</div>
            </div>
            <div className="bg-amber/10 rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center h-40">
              <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center mb-3 relative">
                <i className="ri-notification-3-line text-2xl text-white"></i>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-forest text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              </div>
              <div className="text-lg font-semibold text-forest mb-1">{unreadCount} New</div>
              <div className="text-sm text-gray-600">Notifications</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function getSharedPreviewMembers(
  lists: { sharedWithMembers?: { userId?: string | null; name?: string | null }[] | null }[],
  take: number,
): Array<{ userId: string; name: string }> {
  const byId = new Map<string, string>()

  for (const list of lists) {
    for (const m of list.sharedWithMembers ?? []) {
      if (!m?.userId || !m?.name) continue
      if (!byId.has(m.userId)) byId.set(m.userId, m.name)
    }
  }

  return Array.from(byId, ([userId, name]) => ({ userId, name })).slice(0, Math.max(0, take))
}

function pickPrimaryBudgetId(budgets: Array<{ id?: string; type?: string | null }>): string | null {
  const recurring = budgets.find((b) => Boolean(b.id) && (b.type ?? '').toLowerCase() === 'recurring')
  if (recurring?.id) return recurring.id

  const first = budgets.find((b) => Boolean(b.id))
  return first?.id ?? null
}

function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const code = (currencyCode || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${code}`
  }
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = parts[1]!
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = atob(padded)

    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function getUserIdFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token)
  const sub = payload?.sub
  return typeof sub === 'string' ? sub : null
}

function countUniqueListUpdatesToday(rows: ActivityEntryResponse[]): number {
  const ids = new Set<string>()

  for (const x of rows) {
    const listId = x.listId ?? x.entityId
    if (typeof listId === 'string' && listId) ids.add(listId)
  }

  return ids.size
}

function formatTimeAgo(isoUtc: string): string {
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc

  const diffMs = Date.now() - d.getTime()
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSeconds < 60) return 'just now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatUpcomingWhen(startUtc: string): string {
  const start = new Date(startUtc)
  if (Number.isNaN(start.getTime())) return startUtc

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

  const dayLabel = sameDay(start, now)
    ? 'Today'
    : sameDay(start, tomorrow)
      ? 'Tomorrow'
      : start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  const timeLabel = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel} at ${timeLabel}.`
}
