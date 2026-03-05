import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getUserIdFromAccessToken } from '../../utils/jwt'
import { useI18n } from '../../i18n/i18n'
import { formatTimeAgo } from '../../utils/intl'

type Props = {
  token: string
  family: FamilyResponse
}

export function ProfilePage({ token, family }: Props) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const userId = useMemo(() => getUserIdFromAccessToken(token), [token])

  const profileQuery = useQuery({
    queryKey: queryKeys.userProfileMe,
    queryFn: () => domusApi.getMyProfile(token),
  })

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })

  const recentUpdatesQuery = useQuery({
    queryKey: queryKeys.activityRecent(4),
    queryFn: () => domusApi.getRecentActivity(token, 4),
  })

  const isLoading = familyMembersQuery.isLoading || recentUpdatesQuery.isLoading || profileQuery.isLoading
  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const apiMembersError = familyMembersQuery.error instanceof ApiError ? familyMembersQuery.error : null
  const apiRecentError = recentUpdatesQuery.error instanceof ApiError ? recentUpdatesQuery.error : null
  const apiProfileError = profileQuery.error instanceof ApiError ? profileQuery.error : null

  if (familyMembersQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiMembersError}
        queryKey={queryKeys.familyMembers}
        queryClient={queryClient}
        title={t('profile.errorProfileTitle')}
      />
    )
  }

  if (recentUpdatesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiRecentError}
        queryKey={queryKeys.activityRecent(4)}
        queryClient={queryClient}
        title={t('profile.errorActivitiesTitle')}
      />
    )
  }

  if (profileQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiProfileError}
        queryKey={queryKeys.userProfileMe}
        queryClient={queryClient}
        title={t('profile.errorProfileTitle')}
      />
    )
  }

  const members = familyMembersQuery.data ?? []
  const me = members.find((m) => Boolean(m.userId) && m.userId === userId) ?? null

  const profile = profileQuery.data ?? null

  const nameFromApi = (me?.name ?? '').trim()
  const displayName =
    (profile?.displayName ?? '').trim() || (profile?.name ?? '').trim() || nameFromApi || t('profile.fallbackName')
  const email = (profile?.email ?? '').trim() || (me?.email ?? '').trim()
  const roleLabel = (me?.role ?? family.role ?? '').trim()

  const birthdayLabel = profile?.birthday ? formatBirthday(profile.birthday, locale) : '—'
  const profileColorHex = (profile?.profileColorHex ?? '').trim() || '#2D4A3E'

  const recent = recentUpdatesQuery.data ?? []

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

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.edit')}
            onClick={() => navigate('/profile/edit')}
          >
            <i className="ri-pencil-line text-2xl leading-none" />
          </button>
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
            right={birthdayCountdown(profile?.birthday ?? null, locale)}
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

  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d)
  } catch {
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
  }
}

function birthdayCountdown(isoDate: string | null, locale: string): string | null {
  if (!isoDate) return null
  const parts = isoDate.split('-')
  if (parts.length !== 3) return null

  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null

  const now = new Date()
  const year = now.getFullYear()
  const next = new Date(year, month - 1, day)
  if (Number.isNaN(next.getTime())) return null

  if (next.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    next.setFullYear(year + 1)
  }

  const diffDays = Math.max(0, Math.round((next.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    return rtf.format(diffDays, 'day')
  } catch {
    return diffDays > 0 ? `D-${diffDays}` : '—'
  }
}
