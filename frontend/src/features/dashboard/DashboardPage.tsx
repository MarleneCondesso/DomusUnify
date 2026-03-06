import { useMemo, useState, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { domusApi, type ActivityEntryResponse, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getUserIdFromAccessToken } from '../../utils/jwt'
import { useI18n } from '../../i18n/i18n'
import { CreateBudgetSheet } from '../budget/CreateBudgetSheet'
import { capitalizeFirst, formatCurrency, formatMonthYear, formatTimeAgo, formatUpcomingParts } from '../../utils/intl'

type DashboardPageProps = {
  token: string
  family: FamilyResponse
}

export function DashboardPage({ family, token }: DashboardPageProps) {

  const { t, locale } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const switchFamilyMutation = useMutation({
    mutationFn: (familyId: string) => domusApi.setCurrentFamily(token, { familyId }),
    onSuccess: () => {
      // Trocar de grupo muda o "contexto" para quase todas as queries; limpamos a cache para evitar dados cruzados.
      queryClient.clear()
      navigate('/', { replace: true })
    },
  })
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

  // My Families Query - usado para trocar/criar grupos.
  const myFamiliesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
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
    myFamiliesQuery.isLoading ||
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
  const apiMyFamiliesError = myFamiliesQuery.error instanceof ApiError ? myFamiliesQuery.error : null
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
        title={t('dashboard.error.familyMembers')}
      />
    )
  }

  if (myFamiliesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiMyFamiliesError}
        queryKey={queryKeys.familiesMy}
        queryClient={queryClient}
        title={t('dashboard.error.groups')}
      />
    )
  }

  if (listQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiListsError}
        queryKey={queryKeys.lists}
        queryClient={queryClient}
        title={t('dashboard.error.lists')}
      />
    )
  }

  if (budgetsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiBudgetsError}
        queryKey={queryKeys.budgets}
        queryClient={queryClient}
        title={t('dashboard.error.budgets')}
      />
    )
  }

  if (budgetDetailQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiBudgetDetailError}
        queryKey={primaryBudgetId ? queryKeys.budgetById(primaryBudgetId) : ['budgetById', null]}
        queryClient={queryClient}
        title={t('dashboard.error.budget')}
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
        title={t('dashboard.error.budgetTotals')}
      />
    )
  }

  if (listUpdatesTodayQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiListUpdatesTodayError}
        queryKey={listUpdatesTodayKey}
        queryClient={queryClient}
        title={t('dashboard.error.recentListActivity')}
      />
    )
  }

  if (recentUpdatesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiRecentUpdatesError}
        queryKey={recentUpdatesKey}
        queryClient={queryClient}
        title={t('dashboard.error.recentUpdates')}
      />
    )
  }

  if (unreadNotificationsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiUnreadNotificationsError}
        queryKey={queryKeys.notificationsUnread}
        queryClient={queryClient}
        title={t('dashboard.error.notifications')}
      />
    )
  }

  if (nextScheduleQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiNextScheduleError}
        queryKey={nextScheduleKey}
        queryClient={queryClient}
        title={t('dashboard.error.nextEvent')}
      />
    )
  }

  //#endregion

  //#region ...[Data processing]...

  const familyMembers = familyMembersQuery.data!
  const myFamilies = myFamiliesQuery.data ?? []

  const lists = listQuery.data!
  const listUpdatesToday = listUpdatesTodayQuery.data!

  const budgets = budgetsQuery.data ?? []

  const recentUpdates = recentUpdatesQuery.data!
  const unreadNotifications = unreadNotificationsQuery.data!
  const nextCalendarEvent =
    nextScheduleQuery.data && nextScheduleQuery.data.length > 0 ? nextScheduleQuery.data[0] : null
  const familyName = (family.name ?? '').trim() || t('groups.manage.unnamed')

  const sharedPreviewMembers = getSharedPreviewMembers(lists, 3)
  const updatedListsTodayCount = countUniqueListUpdatesToday(listUpdatesToday)
  const unreadCount = unreadNotifications.length

  const primaryBudget = budgets.find((b) => Boolean(b.id) && b.id === primaryBudgetId) ?? null
  const budgetDetail = budgetDetailQuery.data
  const budgetTotals = budgetTotalsQuery.data

  const monthLabel = budgetTotals?.periodStart
    ? formatMonthYear(new Date(`${budgetTotals.periodStart}T00:00:00Z`), locale)
    : formatMonthYear(new Date(), locale)

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
  const monthlyBudgetTotal = hasBudget ? formatCurrency(remainingBudget, currencyCode, locale) : '—'
  const familySelectorTextStyle = getFamilySelectorTextStyle(familyName)
  const familyHeadingStyle = getFamilyHeadingStyle(familyName)

  //#endregion

  const currentMember = familyMembers.find((m) => Boolean(m.userId) && m.userId === currentUserId) ?? null

  const groupMenuItems: ActionSheetItem[] = [
    {
      id: 'create-group',
      label: t('groups.manage.createGroup'),
      icon: 'ri-add-line',
      onPress: () => {
        setGroupMenuOpen(false)
        navigate('/groups/new')
      },
    },
    ...myFamilies
      .filter((f) => Boolean(f.id))
      .map((f) => {
        const id = f.id!
        const isCurrent = Boolean(family.id) && id === family.id
        const label = (f.name ?? '').trim() || t('groups.manage.unnamed')

        return {
          id,
          label,
          icon: 'ri-group-line',
          disabled: switchFamilyMutation.isPending,
          right: isCurrent ? <i className="ri-check-line text-lg text-forest" /> : null,
          onPress: () => {
            if (isCurrent) {
              setGroupMenuOpen(false)
              return
            }

            setGroupMenuOpen(false)
            switchFamilyMutation.mutate(id)
          },
        } satisfies ActionSheetItem
      }),
  ]


  return (
    <div className="min-h-screen bg-offwhite w-full p-0">

      {/** FAMILY */}
      <section className="bg-linear-to-b from-sage-light to-offwhite py-6">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex w-full items-center justify-between mb-10">
            <button
              type="button"
              className="relative grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark shadow-lg"
              aria-label={t('common.profile')}
              onClick={() => navigate('/profile')}
            >
              <span className="text-base font-bold">{safeInitial(currentMember?.name ?? t('common.me'))}</span>
            </button>

            <button
              type="button"
              className="mx-3 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sage-dark shadow-lg hover:bg-white"
              aria-label={t('common.selectGroup')}
              onClick={() => setGroupMenuOpen(true)}
            >
              <span className="min-w-0 flex-1 text-center font-semibold leading-tight" style={familySelectorTextStyle}>
                {familyName}
              </span>
              <i className="ri-arrow-down-s-line shrink-0 text-2xl leading-none" />
            </button>

            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark shadow-md"
              aria-label={t('settings.title')}
              onClick={() => navigate('/settings')}
            >
              <i className="ri-settings-3-line text-2xl leading-none" />
            </button>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-forest/10 text-forest px-3 py-1.5 rounded-full text-xs font-medium">
              <i className="ri-vip-diamond-line"></i>
              <span>{t('dashboard.badge.activeFamily')}</span>
            </div>
          </div>
          <h1 className="mb-3 max-w-full font-serif font-medium leading-[0.92] text-forest" style={familyHeadingStyle}>
            {familyName}
          </h1>
          <p className="text-lg text-charcoal/80 mb-6">
            {t('dashboard.family.membersLine', { count: familyMembers.length, role: family.role ?? '' })}
          </p>

        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 -mt-12 pb-16">
        {/** LISTS */}
        <div
          className="bg-sage-light rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer"
          onClick={() => navigate('/lists')}
        >
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
          <p className="text-xl font-semibold text-forest mb-1">{t('dashboard.card.lists.title')}</p>
          <p className="text-sm text-charcoal/80">{t('dashboard.card.lists.updatedToday', { count: updatedListsTodayCount })}</p>
          <div className="flex justify-end">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <i className="ri-arrow-right-up-line text-forest" />
            </div>
          </div>
        </div>

        {/** CALENDAR */}
        <div className="bg-amber rounded-2xl p-8 text-white hover:shadow-2xl transition-all cursor-pointer">
          <span className="text-xs font-medium mb-4 opacity-90">{t('dashboard.card.calendar.upcoming')}</span>
          <h3 className="text-3xl font-bold mb-2">{nextCalendarEvent?.title ?? t('dashboard.card.calendar.noUpcomingTitle')}</h3>
          <p className="text-sm opacity-90 mb-4">
            {(() => {
              if (!nextCalendarEvent?.startUtc) return t('dashboard.card.calendar.noUpcomingBody')
              const parts = formatUpcomingParts(nextCalendarEvent.startUtc, locale)
              if (!parts) return t('dashboard.card.calendar.noUpcomingBody')
              return t('common.dayAtTime', { day: parts.dayLabel, time: parts.timeLabel })
            })()}
          </p>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="border-2 border-white text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white hover:text-amber transition-all whitespace-nowrap cursor-pointer"
          >
            {t('dashboard.card.calendar.view')}
          </button>
        </div>


        <div
          className="bg-forest rounded-2xl p-8 text-white relative overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
          onClick={() => {
            if (primaryBudgetId) {
              navigate(`/budgets/${primaryBudgetId}`)
              return
            }

            setCreateBudgetOpen(true)
          }}
        >
          <img
            src="https://readdy.ai/api/search-image?query=happy%20family%20enjoying%20time%20together%20in%20modern%20home%20warm%20atmosphere%20natural%20lighting%20lifestyle%20photography&width=400&height=500&seq=budget1&orientation=portrait"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-t from-forest via-forest/80 to-transparent"></div>
          <div className="relative z-10">
            {hasBudget ? (
              <>
                <div className="text-xl font-semibold mb-4">
                  {capitalizeFirst(monthLabel)}
                </div>
                <div className="mb-4">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-amber rounded-full" style={{ width: `${budgetProgressBar}%` }}></div>
                  </div>
                  <div className="text-sm opacity-90 font-semibold">{t('dashboard.card.budget.spentThisMonth', { percent: budgetProgress })}</div>
                  <div className="text-4xl font-bold">{monthlyBudgetTotal}</div>
                  <div className="text-sm opacity-90 font-semibold">{t('dashboard.card.budget.remaining')}</div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-xl font-semibold">{t('dashboard.card.budget.none.title')}</div>
                <div className="text-sm opacity-90">{t('dashboard.card.budget.none.subtitle')}</div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreateBudgetOpen(true)
                  }}
                >
                  {t('dashboard.card.budget.none.button')} <i className="ri-arrow-right-line text-lg leading-none" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all">
            <h3 className="text-2xl font-bold text-forest mb-6">{t('dashboard.section.recentUpdates')}</h3>
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
                        {x.createdAtUtc ? formatTimeAgo(x.createdAtUtc, locale) : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t('dashboard.recentUpdates.empty')}</p>
              )}
            </div>
            <button
              type="button"
              className="mt-6 text-sm text-amber-dark hover:text-amber font-medium transition-colors cursor-pointer"
              onClick={() => navigate('/activity')}
            >
              {t('dashboard.recentUpdates.viewAll')}
            </button>
          </div>
          <div className="space-y-6">
            <div
              className="bg-sand rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center h-40"
              onClick={() => navigate('/quick-add')}
            >
              <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center mb-3">
                <i className="ri-add-line text-2xl text-white"></i>
              </div>
              <div className="text-lg font-semibold text-forest">{t('dashboard.quickAdd.title')}</div>
            </div>
            <div
              className="bg-amber/10 rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center h-40"
              onClick={() => navigate('/notifications')}
            >
              <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center mb-3 relative">
                <i className="ri-notification-3-line text-2xl text-white"></i>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-forest text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              </div>
              <div className="text-lg font-semibold text-forest mb-1">{t('dashboard.notifications.newCount', { count: unreadCount })}</div>
              <div className="text-sm text-gray-600">{t('dashboard.notifications.title')}</div>
            </div>
          </div>
        </div>
      </section>

      {createBudgetOpen ? (
        <CreateBudgetSheet
          token={token}
          defaultCurrencyCode={currencyCode}
          onClose={() => setCreateBudgetOpen(false)}
          onCreated={(newBudgetId) => {
            setCreateBudgetOpen(false)
            navigate(`/budgets/${newBudgetId}`)
          }}
        />
      ) : null}

      {groupMenuOpen ? (
        <ActionSheet title={t('common.groups')} items={groupMenuItems} onClose={() => setGroupMenuOpen(false)} />
      ) : null}
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

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function getFamilySelectorTextStyle(name: string): CSSProperties {
  const length = name.trim().length

  return {
    fontSize: length >= 28 ? '1rem' : length >= 20 ? '1.125rem' : '1.25rem',
    lineHeight: 1.15,
    overflowWrap: 'anywhere',
  }
}

function getFamilyHeadingStyle(name: string): CSSProperties {
  const length = name.trim().length

  return {
    fontSize: length >= 28 ? 'clamp(2.75rem, 10vw, 4.25rem)' : length >= 20 ? 'clamp(3.25rem, 11vw, 4.75rem)' : 'clamp(3.75rem, 12vw, 5.25rem)',
    overflowWrap: 'anywhere',
  }
}

function countUniqueListUpdatesToday(rows: ActivityEntryResponse[]): number {
  const ids = new Set<string>()

  for (const x of rows) {
    const listId = x.listId ?? x.entityId
    if (typeof listId === 'string' && listId) ids.add(listId)
  }

  return ids.size
}
