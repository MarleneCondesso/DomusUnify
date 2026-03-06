import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { domusApi } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import type { FamilyResponse } from '../../api/domusApi'
import { useI18n } from '../../i18n/i18n'
import { DashboardPage } from '../dashboard/DashboardPage'
import { ActivityPage } from '../activity/ActivityPage'
import { CalendarPage } from '../calendar/Calendar'
import { CreateGroupPage } from './CreateGroupPage'
import { InviteChildAccountPage } from './InviteChildAccountPage'
import { InviteDirectPage } from './InviteDirectPage'
import { InviteLinkPage } from './InviteLinkPage'
import { InviteMembersPage } from './InviteMembersPage'
import { InviteOtherGroupsPage } from './InviteOtherGroupsPage'
import { InviteAcceptPage } from './InviteAcceptPage'
import { ListsPage } from '../lists/ListsPage'
import { CreateListPage } from '../lists/CreateListPage'
import { ListItemsPage } from '../lists/ListItemsPage'
import { QuickAddItemPage } from '../lists/QuickAddItemPage'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { BudgetPage } from '../budget/BudgetPage'
import { ManageAccountsPage } from '../budget/ManageAccountsPage'
import { HiddenAccountsPage } from '../budget/HiddenAccountsPage'
import { ManageCategoriesPage } from '../budget/ManageCategoriesPage'
import { NotificationsPage } from '../notifications/NotificationsPage'
import { ProfilePage } from '../profile/ProfilePage'
import { ManageAccountPage } from '../profile/ManageAccountPage'
import { DarkModePage } from '../settings/DarkModePage'
import { LanguagePage } from '../settings/LanguagePage'
import { ManageGroupsPage } from '../settings/ManageGroupsPage'
import { ManageNotificationsPage } from '../settings/ManageNotificationsPage'
import { SettingsPage } from '../settings/SettingsPage'
import { GroupDetailsPage } from '../settings/GroupDetailsPage'
import { GroupMembersPage } from '../settings/GroupMembersPage'
import { GroupMemberProfilePage } from '../settings/GroupMemberProfilePage'
import { refreshNativeWidgets, syncNativeWidgetState } from '../../native/widgetBridge'

type Props = {
  token: string
  onLogout: () => void
}

/**
 * "Gate" (portão) que garante que o utilizador autenticado tem:
 * - um token JWT válido
 * - uma "família atual" definida (contexto usado pela maioria dos endpoints)
 *
 * Depois disso, renderiza o resto da app (ex.: Listas).
 */
export function FamilyGatePage({ token, onLogout }: Props) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const { t } = useI18n()
  const routeFamilyId = useMemo(() => {
    const value = new URLSearchParams(location.search).get('familyId')?.trim()
    return value || null
  }, [location.search])
  const switchingFamilyRef = useRef<string | null>(null)

  type ModalState = {
    backgroundLocation?: Location
  }

  const backgroundLocation = (location.state as ModalState | null)?.backgroundLocation

  const meQuery = useQuery({
    queryKey: queryKeys.familyMe,
    queryFn: () => domusApi.getMyFamily(token),
  })

  // Alguns erros são "esperados" no fluxo (ex.: ainda não tens família atual).
  const apiError = meQuery.error instanceof ApiError ? meQuery.error : null
  const isNoCurrentFamily = apiError?.status === 404
  const isUnauthorized = apiError?.status === 401

  const routeFamilyMutation = useMutation({
    mutationFn: (familyId: string) => domusApi.setCurrentFamily(token, { familyId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyMe })
    },
    onSettled: () => {
      switchingFamilyRef.current = null
    },
  })

  const shouldSwitchToRouteFamily = Boolean(routeFamilyId) && (
    isNoCurrentFamily ||
    (meQuery.isSuccess && meQuery.data?.id && meQuery.data.id !== routeFamilyId)
  )

  useEffect(() => {
    const familyId = meQuery.data?.id ?? null
    void syncNativeWidgetState({ familyId }).catch(() => undefined)
  }, [meQuery.data?.id])

  useEffect(() => {
    if (!meQuery.data?.id) return
    void refreshNativeWidgets().catch(() => undefined)
  }, [meQuery.data?.id])

  useEffect(() => {
    if (!routeFamilyId || !shouldSwitchToRouteFamily) return
    if (switchingFamilyRef.current === routeFamilyId) return

    switchingFamilyRef.current = routeFamilyId
    routeFamilyMutation.mutate(routeFamilyId)
  }, [routeFamilyId, routeFamilyMutation, shouldSwitchToRouteFamily])

  if (isUnauthorized) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold">{t('auth.sessionExpired.title')}</h2>
        <p className="mt-2 text-sm text-charcoal/70">{t('auth.sessionExpired.body')}</p>
        <button
          className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
          onClick={onLogout}
          type="button"
        >
          {t('auth.sessionExpired.button')}
        </button>
      </div>
    )
  }

  if (meQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (routeFamilyMutation.isPending || (shouldSwitchToRouteFamily && !routeFamilyMutation.isError)) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (routeFamilyMutation.isError) {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">{t('family.current.errorTitle')}</h2>
        <pre className="mt-3 whitespace-pre-wrap wrap-break-words rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white">
          {routeFamilyMutation.error instanceof ApiError
            ? JSON.stringify(routeFamilyMutation.error.body, null, 2)
            : String(routeFamilyMutation.error)}
        </pre>
        <button
          className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
          onClick={() => {
            if (!routeFamilyId) return
            switchingFamilyRef.current = routeFamilyId
            routeFamilyMutation.mutate(routeFamilyId)
          }}
          type="button"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    )
  }

  if (meQuery.isError && !isNoCurrentFamily) {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">{t('family.current.errorTitle')}</h2>
        <pre className="mt-3 whitespace-pre-wrap wrap-break-words rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white">
          {apiError ? JSON.stringify(apiError.body, null, 2) : String(meQuery.error)}
        </pre>
        <button
          className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.familyMe })}
          type="button"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    )
  }

  if (isNoCurrentFamily) {
    return (
      <Routes>
        <Route path="/invite/:inviteToken" element={<InviteAcceptPage token={token} />} />
        <Route path="*" element={<NoCurrentFamily token={token} />} />
      </Routes>
    )
  }

  const family = meQuery.data!
  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<DashboardPage token={token} family={family} />} />
        <Route path="/activity" element={<ActivityPage token={token} family={family} />} />
        <Route path="/quick-add" element={<QuickAddItemPage token={token} family={family} />} />
        <Route path="/notifications" element={<NotificationsPage token={token} family={family} />} />
        <Route path="/profile" element={<ProfilePage token={token} family={family} />} />
        <Route path="/profile/edit" element={<ManageAccountPage token={token} family={family} />} />
        <Route path="/settings" element={<SettingsPage token={token} family={family} onLogout={onLogout} />} />
        <Route path="/settings/dark-mode" element={<DarkModePage />} />
        <Route path="/settings/language" element={<LanguagePage />} />
        <Route path="/settings/notifications" element={<ManageNotificationsPage />} />
        <Route path="/settings/groups" element={<ManageGroupsPage token={token} family={family} />} />
        <Route path="/settings/groups/:familyId" element={<GroupDetailsPage token={token} family={family} />} />
        <Route path="/settings/groups/:familyId/members" element={<GroupMembersPage token={token} />} />
        <Route path="/settings/groups/:familyId/members/:userId" element={<GroupMemberProfilePage token={token} />} />
        <Route path="/groups/new" element={<CreateGroupPage token={token} />} />
        <Route path="/groups/invite/:familyId" element={<InviteMembersPage token={token} />} />
        <Route path="/groups/invite/:familyId/link" element={<InviteLinkPage token={token} />} />
        <Route path="/groups/invite/:familyId/direct" element={<InviteDirectPage token={token} />} />
        <Route path="/groups/invite/:familyId/child" element={<InviteChildAccountPage />} />
        <Route path="/groups/invite/:familyId/others" element={<InviteOtherGroupsPage />} />
        <Route path="/invite/:inviteToken" element={<InviteAcceptPage token={token} />} />
        <Route path="/budgets/:budgetId" element={<BudgetPage token={token} family={family} />} />
        <Route path="/budgets/:budgetId/categories" element={<ManageCategoriesPage token={token} />} />
        <Route path="/budgets/:budgetId/accounts" element={<ManageAccountsPage token={token} />} />
        <Route path="/budgets/:budgetId/accounts/hidden" element={<HiddenAccountsPage token={token} />} />
        <Route path="/calendar" element={<CalendarPage token={token} family={family} />} />
        <Route path="/lists" element={<ListsPage token={token} family={family} onLogout={onLogout} />} />
        <Route path="/lists/new" element={<CreateListPage token={token} family={family} onLogout={onLogout} />} />
        <Route path="/lists/items/:listId" element={<ListItemsPage token={token} family={family} onLogout={onLogout}/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route path="/lists/new" element={<CreateListPage token={token} family={family} onLogout={onLogout} />} />
        </Routes>
      ) : null}
    </>
  )
}

function NoCurrentFamily({ token }: { token: string }) {
  const queryClient = useQueryClient()
  const [newFamilyName, setNewFamilyName] = useState('')
  const { t } = useI18n()

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
  })

  const createFamilyMutation = useMutation({
    mutationFn: () => domusApi.createFamily(token, { name: newFamilyName }),
    onSuccess: (family) => {
      // Como o backend define automaticamente a família criada como atual,
      // podemos colocar já na cache e seguir o fluxo.
      queryClient.setQueryData<FamilyResponse>(queryKeys.familyMe, family)
      queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy })
    },
  })

  const setCurrentMutation = useMutation({
    mutationFn: (familyId: string) => domusApi.setCurrentFamily(token, { familyId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyMe })
    },
  })

  const errorMessage = useMemo(() => {
    const err = createFamilyMutation.error || setCurrentMutation.error || familiesQuery.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    return t('common.unexpectedError')
  }, [createFamilyMutation.error, familiesQuery.error, setCurrentMutation.error, t])

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <h2 className="text-xl font-semibold text-charcoal">{t('family.noCurrent.title')}</h2>
      <p className="mt-2 text-sm text-charcoal/70">{t('family.noCurrent.subtitle')}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">{t('family.noCurrent.createNew.title')}</h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createFamilyMutation.mutate()
            }}
          >
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70">{t('family.noCurrent.createNew.nameLabel')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                required
              />
            </label>
            <button
              className="w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-forest/40"
              type="submit"
              disabled={createFamilyMutation.isPending}
            >
              {t('family.noCurrent.createNew.button')}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-charcoal">{t('family.noCurrent.selectExisting.title')}</h3>
          {familiesQuery.isLoading && (
            <div className="mt-3">
              <LoadingSpinner />
            </div>
          )}

          {familiesQuery.data?.length === 0 && (
            <p className="mt-3 text-sm text-charcoal">{t('family.noCurrent.selectExisting.empty')}</p>
          )}

          <ul className="mt-3 space-y-2">
            {familiesQuery.data?.map((f) => {
              // O OpenAPI não marca `id` como required, por isso o tipo vem como opcional.
              // Na prática, o backend devolve sempre o `id`. Mesmo assim, protegemos o UI.
              const familyId = f.id
              if (!familyId) return null

              return (
                <li
                  key={familyId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-sand-light bg-amber px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">{f.name}</div>
                    <div className="text-sm text-white/70">{t('family.noCurrent.roleLabel', { role: f.role ?? '' })}</div>
                  </div>
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => setCurrentMutation.mutate(familyId)}
                    disabled={setCurrentMutation.isPending}
                  >
                    {t('family.noCurrent.setCurrent')}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          {t('common.error')}: {errorMessage}
        </div>
      )}
    </div>
  )
}
