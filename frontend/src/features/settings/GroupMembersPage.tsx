import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { domusApi } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { SwipeableRow } from '../../ui/SwipeableRow'
import { ErrorDisplay } from '../../utils/ErrorDisplay'

type Props = {
  token: string
}

export function GroupMembersPage({ token }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { familyId } = useParams<{ familyId: string }>()
  const { t } = useI18n()

  const removeMode = new URLSearchParams(location.search).get('mode') === 'remove'

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
  })

  const group = useMemo(() => {
    if (!familyId) return null
    return (familiesQuery.data ?? []).find((g) => g.id === familyId) ?? null
  }, [familiesQuery.data, familyId])

  const roleLabel = (group?.role ?? '').trim()
  const isAdmin = roleLabel.toLowerCase() === 'admin'

  const membersQuery = useQuery({
    queryKey: queryKeys.familyMembersByFamilyId(familyId ?? 'unknown'),
    queryFn: () => domusApi.getFamilyMembersByFamilyId(token, familyId!),
    enabled: Boolean(familyId),
  })

  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set())

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!familyId) throw new Error(t('group.members.invalid'))
      await domusApi.removeFamilyMember(token, familyId, userId)
    },
    onSuccess: async () => {
      setRemovingIds(new Set())
      if (!familyId) return

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMembersByFamilyId(familyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy }),
      ])
    },
    onError: (err) => {
      setRemovingIds(new Set())
      window.alert(err instanceof ApiError ? JSON.stringify(err.body) : err instanceof Error ? err.message : t('group.members.removeError'))
    },
  })

  if (!familyId) {
    return (
      <div className="min-h-screen bg-offwhite w-full">
        <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
          <div className="flex items-center justify-between px-6 py-6">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
              aria-label={t('common.back')}
              onClick={() => navigate('/settings/groups')}
            >
              <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
            </button>

            <div className="text-lg font-bold text-forest">{t('group.members.title')}</div>
            <div className="h-12 w-12" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
          <div className="rounded-2xl bg-white px-5 py-6 text-center text-sm text-gray-500 shadow-sm">{t('group.members.invalid')}</div>
        </main>
      </div>
    )
  }

  const groupName = (group?.name ?? '').trim() || t('group.details.title')

  const familiesApiError = familiesQuery.error instanceof ApiError ? familiesQuery.error : null
  if (familiesQuery.isError) {
    return <ErrorDisplay apiError={familiesApiError} queryKey={queryKeys.familiesMy} queryClient={queryClient} title={t('groups.manage.errorTitle')} />
  }

  if (membersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-offwhite w-full">
        <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
          <div className="flex items-center justify-between px-6 py-6">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
              aria-label={t('common.back')}
              onClick={() => navigate(-1)}
            >
              <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
            </button>
            <div className="text-lg font-bold text-forest">{t('group.members.title')}</div>
            <div className="h-12 w-12" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
          <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    )
  }

  const membersApiError = membersQuery.error instanceof ApiError ? membersQuery.error : null
  if (membersQuery.isError) {
    return (
      <ErrorDisplay
        apiError={membersApiError}
        queryKey={queryKeys.familyMembersByFamilyId(familyId)}
        queryClient={queryClient}
        title={t('group.members.errorTitle')}
      />
    )
  }

  const rows = (membersQuery.data ?? []).filter((m) => Boolean(m.userId))

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-forest">{t('group.members.title')}</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-charcoal">{groupName}</div>
            <div className="text-xs text-gray-500">{roleLabel || '—'}</div>
          </div>
        </div>

        {removeMode && !isAdmin ? (
          <div className="mb-4 rounded-2xl border border-amber/30 bg-amber/15 px-4 py-3 text-sm text-amber-dark">
            {t('group.members.onlyAdminsRemove')}
          </div>
        ) : null}

        {removeMode && isAdmin ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {t('group.members.swipeToRemove')}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {rows.map((m, idx) => {
            const userId = m.userId!
            const isRemoving = removingIds.has(userId)
            const memberRole = (m.role ?? '').trim()

            const canRemove = removeMode && isAdmin && !isRemoving && !removeMutation.isPending

            const content = (
              <button
                type="button"
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light disabled:opacity-60"
                onClick={() => navigate(`/settings/groups/${familyId}/members/${userId}`)}
                disabled={isRemoving}
              >
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-sand-light text-forest font-semibold">
                    {safeInitial(m.name ?? '')}
                  </div>
                  {memberRole.toLowerCase() === 'admin' ? (
                    <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-sage-dark text-white">
                      <i className="ri-vip-crown-2-fill text-base leading-none" aria-hidden="true" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-charcoal">{(m.name ?? '').trim() || '—'}</div>
                  <div className="truncate text-xs text-gray-500">{(m.email ?? '').trim() || '—'}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-sand-light px-3 py-1 text-xs font-semibold text-sage-dark">{memberRole || '—'}</span>
                  <i
                    className={
                      isRemoving
                        ? 'ri-loader-4-line animate-spin text-2xl text-gray-300'
                        : 'ri-arrow-right-s-line text-2xl leading-none text-gray-300'
                    }
                    aria-hidden="true"
                  />
                </div>
              </button>
            )

            return canRemove ? (
              <SwipeableRow
                key={userId}
                className="bg-red-50"
                threshold={108}
                rightAction={
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
                    <i className="ri-delete-bin-6-line text-xl" aria-hidden="true" />
                  </div>
                }
                onSwipedLeft={() => {
                  const confirmed = window.confirm(t('group.members.confirmRemove'))
                  if (!confirmed) return

                  setRemovingIds((prev) => {
                    const next = new Set(prev)
                    next.add(userId)
                    return next
                  })

                  removeMutation.mutate(userId)
                }}
              >
                {content}
              </SwipeableRow>
            ) : (
              <div key={userId ?? `m-${idx}`}>{content}</div>
            )
          })}

          {rows.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-500">{t('group.members.empty')}</div> : null}
        </section>
      </main>
    </div>
  )
}

function safeInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
