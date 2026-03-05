import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'

type Props = {
  token: string
  family: FamilyResponse
}

export function GroupDetailsPage({ token, family }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { familyId } = useParams<{ familyId: string }>()
  const { t } = useI18n()

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
  })

  const group = useMemo(() => {
    if (!familyId) return null
    return (familiesQuery.data ?? []).find((g) => g.id === familyId) ?? null
  }, [familiesQuery.data, familyId])

  const currentFamilyId = family.id ?? null
  const isCurrent = Boolean(familyId) && Boolean(currentFamilyId) && familyId === currentFamilyId
  const roleLabel = (group?.role ?? '').trim()
  const isAdmin = roleLabel.toLowerCase() === 'admin'

  const switchMutation = useMutation({
    mutationFn: async () => {
      if (!familyId) throw new Error(t('group.details.invalid'))
      await domusApi.setCurrentFamily(token, { familyId })
    },
    onSuccess: () => {
      queryClient.clear()
      navigate('/', { replace: true })
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('group.details.switchError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!familyId) throw new Error(t('group.details.invalid'))
      await domusApi.deleteFamily(token, familyId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy })

      if (isCurrent) {
        queryClient.clear()
        navigate('/', { replace: true })
      } else {
        navigate('/settings/groups', { replace: true })
      }
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('group.details.deleteError'))
    },
  })

  if (familiesQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const apiError = familiesQuery.error instanceof ApiError ? familiesQuery.error : null
  if (familiesQuery.isError) {
    return <ErrorDisplay apiError={apiError} queryKey={queryKeys.familiesMy} queryClient={queryClient} title={t('groups.manage.errorTitle')} />
  }

  if (!familyId || !group?.id) {
    return (
      <div className="min-h-screen bg-offwhite w-full">
        <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
          <div className="flex items-center justify-between px-6 py-6">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
              aria-label={t('common.back')}
              onClick={() => navigate('/settings/groups', { replace: true })}
            >
              <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
            </button>

            <div className="text-lg font-bold text-forest">{t('group.details.title')}</div>
            <div className="h-12 w-12" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
          <div className="rounded-2xl bg-white px-5 py-6 text-center text-sm text-gray-500 shadow-sm">{t('group.details.notFound')}</div>
        </main>
      </div>
    )
  }

  const groupName = (group.name ?? '').trim() || t('groups.manage.unnamed')

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center justify-center rounded-full bg-offwhite hover:bg-white text-sage-dark px-4 py-2 shadow-lg"
            aria-label={t('common.back')}
            onClick={() => navigate('/settings/groups', { replace: true })}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-forest">{t('group.details.title')}</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-sand-light text-forest text-2xl font-extrabold">
              {safeInitial(groupName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-extrabold text-charcoal">{groupName}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sand-light px-3 py-1 text-xs font-semibold text-sage-dark">{roleLabel || '—'}</span>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage-dark/10 px-3 py-1 text-xs font-semibold text-sage-dark">
                    <i className="ri-vip-crown-2-fill text-base leading-none" aria-hidden="true" />
                    {t('group.details.currentBadge')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {!isCurrent ? (
            <button
              type="button"
              className="mt-5 w-full rounded-2xl bg-forest px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => switchMutation.mutate()}
              disabled={switchMutation.isPending || deleteMutation.isPending}
            >
              {switchMutation.isPending ? t('group.details.settingCurrent') : t('group.details.setCurrent')}
            </button>
          ) : null}
        </section>

        <div className="h-6" />

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <ActionRow
            icon="ri-group-line"
            label={t('group.details.viewMembers')}
            subtitle={t('group.details.viewMembers.subtitle')}
            onClick={() => navigate(`/settings/groups/${familyId}/members`)}
          />

          {isAdmin ? (
            <ActionRow
              icon="ri-user-add-line"
              label={t('group.details.inviteMember')}
              subtitle={t('group.details.inviteMember.subtitle')}
              onClick={() =>
                navigate(`/groups/invite/${familyId}`, {
                  state: { inviteFlow: { closeTo: `/settings/groups/${familyId}`, leftIcon: 'back' } },
                })
              }
            />
          ) : null}

          {isAdmin ? (
            <ActionRow
              icon="ri-user-unfollow-line"
              label={t('group.details.removeMembers')}
              subtitle={t('group.details.removeMembers.subtitle')}
              onClick={() => navigate(`/settings/groups/${familyId}/members?mode=remove`)}
            />
          ) : null}

          {isAdmin ? (
            <ActionRow
              icon="ri-delete-bin-6-line"
              label={t('group.details.deleteGroup')}
              subtitle={t('group.details.deleteGroup.subtitle')}
              danger
              onClick={() => {
                if (deleteMutation.isPending) return
                const ok = window.confirm(t('group.details.deleteGroup.confirm'))
                if (!ok) return
                deleteMutation.mutate()
              }}
            />
          ) : null}
        </section>
      </main>
    </div>
  )
}

function ActionRow({
  icon,
  label,
  subtitle,
  onClick,
  danger,
}: {
  icon: string
  label: string
  subtitle?: string
  onClick: () => void
  danger?: boolean
}) {
  const iconWrap = danger ? 'bg-red-500/10 text-red-600' : 'bg-sand-light text-sage-dark'
  const labelClass = danger ? 'text-red-600' : 'text-charcoal'
  return (
    <button type="button" className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light" onClick={onClick}>
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${iconWrap}`}>
        <i className={`${icon} text-xl`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-base font-semibold ${labelClass}`}>{label}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
    </button>
  )
}

function safeInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
