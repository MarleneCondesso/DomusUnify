import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getUserIdFromAccessToken } from '../../utils/jwt'
import { useProfilePrefs } from '../../utils/profilePrefs'

type Props = {
  token: string
  family: FamilyResponse
}

export function ProfilePage({ token, family }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const userId = useMemo(() => getUserIdFromAccessToken(token), [token])
  const { prefs } = useProfilePrefs(userId)

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })

  const recentUpdatesQuery = useQuery({
    queryKey: queryKeys.activityRecent(4),
    queryFn: () => domusApi.getRecentActivity(token, 4),
  })

  const isLoading = familyMembersQuery.isLoading || recentUpdatesQuery.isLoading
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

  if (familyMembersQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiMembersError}
        queryKey={queryKeys.familyMembers}
        queryClient={queryClient}
        title="Erro ao obter perfil"
      />
    )
  }

  if (recentUpdatesQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiRecentError}
        queryKey={queryKeys.activityRecent(4)}
        queryClient={queryClient}
        title="Erro ao obter atividades"
      />
    )
  }

  const members = familyMembersQuery.data ?? []
  const me = members.find((m) => Boolean(m.userId) && m.userId === userId) ?? null

  const nameFromApi = (me?.name ?? '').trim()
  const displayName = (prefs.displayName ?? '').trim() || nameFromApi || 'Você'
  const email = (me?.email ?? '').trim()
  const roleLabel = (me?.role ?? family.role ?? '').trim()

  const color = prefs.profileColorHex ?? '#8b5cf6'
  const birthdayLabel = prefs.birthday ? formatBirthday(prefs.birthday) : '—'

  const recent = recentUpdatesQuery.data ?? []

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="relative bg-charcoal text-white">
        <div className="flex items-center justify-between px-4 pt-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/15"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/15"
            aria-label="Editar"
            onClick={() => navigate('/profile/edit')}
          >
            <i className="ri-pencil-line text-2xl leading-none" />
          </button>
        </div>

        <div className="px-4 pb-10 pt-6 text-center">
          <div className="mx-auto mb-4 relative h-28 w-28">
            <div
              className="grid h-28 w-28 place-items-center rounded-full bg-black/30 text-5xl font-light"
              style={{ outline: `4px solid ${color}` }}
            >
              {safeInitial(displayName)}
            </div>
            <div className="absolute -top-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-purple-500 text-white shadow">
              <i className="ri-vip-crown-2-fill text-xl leading-none" />
            </div>
          </div>

          <div className="text-4xl font-bold">{displayName}</div>
          <div className="mt-3 inline-flex items-center rounded-full bg-purple-500/90 px-4 py-1.5 text-xs font-semibold">
            PREMIUM
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 -mt-6 space-y-5">
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-gray-400">ID DA CONTA</div>
          </div>
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-gray-600">
              <i className="ri-user-line text-xl" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-charcoal">{email || '—'}</div>
              <div className="text-xs text-gray-500">
                {email ? (
                  <>
                    ID da conta · <span className="text-red-400 font-semibold">Não verificado</span>
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
            <div className="text-xs font-bold tracking-wide text-gray-400">INFORMAÇÕES</div>
          </div>

          <InfoRow icon="ri-mail-line" label={email || '—'} subtitle="Endereço de e-mail" />
          <InfoRow icon="ri-cake-2-line" label={birthdayLabel} subtitle="Aniversário" right={birthdayCountdown(prefs.birthday)} />
          <InfoRow icon="ri-team-line" label={roleLabel || '—'} subtitle="Papel da família" />
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-gray-400">PREMIUM</div>
          </div>
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-sand-light"
            onClick={() => window.alert('Em breve.')}
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
              <i className="ri-vip-crown-2-line text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-charcoal">Assinatura Premium</div>
              <div className="text-xs text-gray-500">Confira todos os seus benefícios premium</div>
            </div>
            <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
          </button>
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold tracking-wide text-gray-400">ÚLTIMAS ATIVIDADES</div>
          </div>
          {recent.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recent.map((x, idx) => (
                <li key={x.id ?? `${idx}`} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-gray-600">
                      <i className="ri-notification-3-line text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-charcoal">
                        {(x.message ?? '').trim() || 'Atualização'}
                      </div>
                      <div className="text-xs text-gray-500">{x.createdAtUtc ? formatTimeAgo(x.createdAtUtc) : ''}</div>
                    </div>
                    <i className="ri-calendar-line text-xl leading-none text-gray-300" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-gray-500">Sem atividade.</div>
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
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-gray-600">
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

function formatBirthday(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function birthdayCountdown(isoDate: string | null): string | null {
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
  return diffDays > 0 ? `d-${diffDays}` : 'Hoje'
}

function formatTimeAgo(isoUtc: string): string {
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc

  const diffMs = Date.now() - d.getTime()
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSeconds < 60) return 'agora'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} d`
}

