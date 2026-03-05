import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { formatTimeAgo } from '../../utils/intl'

type Props = {
  token: string
}

export function GroupMemberProfilePage({ token }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { familyId, userId } = useParams<{ familyId: string; userId: string }>()
  const [actionsOpen, setActionsOpen] = useState(false)
  const { t, locale } = useI18n()

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
  })

  const myGroupRole = useMemo(() => {
    if (!familyId) return ''
    return ((familiesQuery.data ?? []).find((g) => g.id === familyId)?.role ?? '').trim()
  }, [familiesQuery.data, familyId])

  const isAdmin = myGroupRole.toLowerCase() === 'admin'

  const memberProfileQuery = useQuery({
    queryKey: queryKeys.familyMemberProfile({ familyId: familyId ?? 'unknown', userId: userId ?? 'unknown' }),
    queryFn: () => domusApi.getFamilyMemberProfile(token, familyId!, userId!),
    enabled: Boolean(familyId && userId),
  })

  const recentUpdatesQuery = useQuery({
    queryKey: queryKeys.familyActivityRecentByFamilyId({ familyId: familyId ?? 'unknown', take: 4 }),
    queryFn: () => domusApi.getFamilyActivityRecent(token, familyId!, 4),
    enabled: Boolean(familyId),
  })

  const promoteMutation = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error(t('memberProfile.invalid'))
      await domusApi.makeFamilyMemberAdmin(token, familyId, userId)
    },
    onSuccess: async () => {
      if (!familyId) return
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMembersByFamilyId(familyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMemberProfile({ familyId, userId: userId ?? 'unknown' }) }),
      ])
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('memberProfile.makeAdmin.error'))
    },
  })

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error(t('memberProfile.invalid'))
      await domusApi.removeFamilyMember(token, familyId, userId)
    },
    onSuccess: async () => {
      if (!familyId) return
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMembersByFamilyId(familyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMemberProfile({ familyId, userId: userId ?? 'unknown' }) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy }),
      ])
      navigate(`/settings/groups/${familyId}/members`, { replace: true })
    },
    onError: (err) => {
      window.alert(
        err instanceof ApiError ? JSON.stringify(err.body) : err instanceof Error ? err.message : t('memberProfile.removeFromGroup.error'),
      )
    },
  })

  if (!familyId || !userId) {
    return (
      <div className="min-h-screen bg-offwhite w-full">
        <header className="relative bg-linear-to-b from-sage-light to-offwhite">
          <div className="flex items-center justify-between px-6 pt-6">
            <button
              type="button"
              className="grid h-12 w-12 py-3.5 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark "
              aria-label={t('common.back')}
              onClick={() => navigate(-1)}
            >
              <i className="ri-arrow-left-line text-2xl leading-none" />
            </button>
            <div className="h-12 w-12" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
          <div className="rounded-2xl bg-white px-5 py-6 text-center text-sm text-gray-500 shadow-sm">{t('memberProfile.invalid')}</div>
        </main>
      </div>
    )
  }

  const isLoading = familiesQuery.isLoading || memberProfileQuery.isLoading || recentUpdatesQuery.isLoading
  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const familiesApiError = familiesQuery.error instanceof ApiError ? familiesQuery.error : null
  const memberApiError = memberProfileQuery.error instanceof ApiError ? memberProfileQuery.error : null
  const recentApiError = recentUpdatesQuery.error instanceof ApiError ? recentUpdatesQuery.error : null

  if (familiesQuery.isError) {
    return <ErrorDisplay apiError={familiesApiError} queryKey={queryKeys.familiesMy} queryClient={queryClient} title={t('groups.manage.errorTitle')} />
  }

  if (memberProfileQuery.isError) {
    return (
      <ErrorDisplay
        apiError={memberApiError}
        queryKey={queryKeys.familyMemberProfile({ familyId, userId })}
        queryClient={queryClient}
        title={t('memberProfile.errorProfileTitle')}
      />
    )
  }

  if (recentUpdatesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={recentApiError}
        queryKey={queryKeys.familyActivityRecentByFamilyId({ familyId, take: 4 })}
        queryClient={queryClient}
        title={t('memberProfile.errorActivitiesTitle')}
      />
    )
  }

  const profile = memberProfileQuery.data ?? null
  const recent = recentUpdatesQuery.data ?? []

  const nameFromApi = (profile?.name ?? '').trim()
  const displayName = (profile?.displayName ?? '').trim() || nameFromApi || '—'
  const email = (profile?.email ?? '').trim()
  const roleLabel = (profile?.role ?? '').trim()

  const birthdayLabel = profile?.birthday ? formatBirthday(profile.birthday, locale) : '—'
  const profileColorHex = (profile?.profileColorHex ?? '').trim() || '#2D4A3E'
  const isMemberAdmin = roleLabel.toLowerCase() === 'admin'

  const actionItems: ActionSheetItem[] = []
  if (isAdmin) {
    if (!isMemberAdmin) {
      actionItems.push({
        id: 'make-admin',
        label: t('memberProfile.makeAdmin'),
        icon: 'ri-vip-crown-2-line',
        disabled: promoteMutation.isPending || removeMutation.isPending,
        onPress: () => {
          setActionsOpen(false)
          const ok = window.confirm(t('memberProfile.makeAdmin.confirm'))
          if (!ok) return
          promoteMutation.mutate()
        },
      })
    }

    actionItems.push({
      id: 'remove',
      label: t('memberProfile.removeFromGroup'),
      icon: 'ri-delete-bin-6-line',
      tone: 'danger',
      disabled: promoteMutation.isPending || removeMutation.isPending,
      onPress: () => {
        setActionsOpen(false)
        const ok = window.confirm(t('memberProfile.removeFromGroup.confirm'))
        if (!ok) return
        removeMutation.mutate()
      },
    })
  }

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="relative bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between px-6 pt-6">
          <button
            type="button"
            className="grid h-12 w-12 py-3.5 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark "
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>

          {actionItems.length > 0 ? (
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
              aria-label={t('memberProfile.actions')}
              onClick={() => setActionsOpen(true)}
            >
              <i className="ri-more-2-fill text-2xl leading-none" />
            </button>
          ) : (
            <div className="h-12 w-12" />
          )}
        </div>

        <div className="px-4 pb-10 pt-6 text-center text-forest">
          <div className="mx-auto mb-4 relative h-28 w-28">
            <div
              className="grid h-28 w-28 place-items-center rounded-full bg-sage-dark/25 text-5xl font-light text-forest"
              style={{ outline: `4px solid ${profileColorHex}` }}
            >
              {safeInitial(displayName)}
            </div>
          </div>

          <div className="text-4xl font-bold">{displayName}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-6 space-y-6 mt-6">
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-forest">{t('memberProfile.section.accountId')}</div>
          </div>
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
              <i className="ri-user-line text-xl" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-charcoal">{email || '—'}</div>
              <div className="text-xs text-gray-500">
                {email ? (
                  <>
                    {t('memberProfile.accountId.label')} ·{' '}
                    <span className="text-red-400 font-semibold">{t('memberProfile.accountId.notVerified')}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-red-500/10 text-red-500">
              <i className="ri-error-warning-line text-xl" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-forest">{t('memberProfile.section.info')}</div>
          </div>

          <InfoRow icon="ri-mail-line" label={email || '—'} subtitle={t('memberProfile.info.email')} />
          <InfoRow
            icon="ri-cake-2-line"
            label={birthdayLabel}
            subtitle={t('memberProfile.info.birthday')}
            right={birthdayCountdown(profile?.birthday ?? null, locale, t('common.today'))}
          />
          <InfoRow icon="ri-team-line" label={roleLabel || '—'} subtitle={t('memberProfile.info.role')} />
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-forest">{t('memberProfile.section.recent')}</div>
          </div>
          {recent.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recent.map((x, idx) => (
                <li key={x.id ?? `${idx}`} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
                      <i className="ri-notification-3-line text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-charcoal">
                        {(x.message ?? '').trim() || t('memberProfile.activityFallback')}
                      </div>
                      <div className="text-xs text-gray-500">{x.createdAtUtc ? formatTimeAgo(x.createdAtUtc, locale) : ''}</div>
                    </div>
                    <i className="ri-calendar-line text-xl leading-none text-gray-300" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-gray-500">{t('memberProfile.noActivity')}</div>
          )}
        </section>
      </main>

      {actionsOpen ? <ActionSheet title={t('memberProfile.actions')} items={actionItems} onClose={() => setActionsOpen(false)} /> : null}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  subtitle,
  right,
}: {
  icon: string
  label: string
  subtitle: string
  right?: string | null
}) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
        <i className={`${icon} text-xl`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-charcoal">{label}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
      {right ? <div className="text-xs text-gray-400">{right}</div> : null}
    </div>
  )
}

function safeInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function formatBirthday(isoDate: string, locale: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

function birthdayCountdown(isoDate: string | null, locale: string, todayLabel: string): string | null {
  if (!isoDate) return null
  const parts = isoDate.split('-')
  if (parts.length !== 3) return null

  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const year = now.getFullYear()
  const next = new Date(year, month - 1, day)
  if (Number.isNaN(next.getTime())) return null

  const nextStart = new Date(next.getFullYear(), next.getMonth(), next.getDate())

  if (nextStart.getTime() < todayStart.getTime()) {
    next.setFullYear(year + 1)
  }

  const nextStartAdjusted = new Date(next.getFullYear(), next.getMonth(), next.getDate())
  const diffDays = Math.max(0, Math.round((nextStartAdjusted.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000)))

  if (diffDays === 0) return todayLabel

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    return rtf.format(diffDays, 'day')
  } catch {
    return `${diffDays} d`
  }
}
