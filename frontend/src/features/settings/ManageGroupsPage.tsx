import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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

export function ManageGroupsPage({ token, family }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
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
    return (
      <ErrorDisplay apiError={apiError} queryKey={queryKeys.familiesMy} queryClient={queryClient} title={t('groups.manage.errorTitle')} />
    )
  }

  const groups = (familiesQuery.data ?? []).filter((g) => Boolean(g.id))

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-white bg-offwhite shadow-md py-3.5"
            aria-label={t('common.back')}
            onClick={() => navigate('/settings', { replace: true })}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-forest">{t('settings.manageGroups')}</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full "
            aria-label={t('groups.manage.createGroup')}
            onClick={() => navigate('/groups/new')}
          >
            <i className="ri-add-line text-2xl leading-none text-sage-dark" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <div className="text-xs font-bold tracking-wide text-gray-400 mb-4">{t('groups.manage.sectionTitle')}</div>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          {groups.map((g) => {
            const id = g.id!
            const name = (g.name ?? '').trim() || t('groups.manage.unnamed')
            const isCurrent = Boolean(family.id) && id === family.id
            const roleLabel = (g.role ?? '').trim()

            return (
              <button
                key={id}
                type="button"
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light disabled:opacity-60"
                onClick={() => navigate(`/settings/groups/${id}`)}
              >
                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-sand-light text-forest font-semibold">
                    {safeInitial(name)}
                  </div>
                  {isCurrent ? (
                    <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-sage-dark text-white">
                      <i className="ri-vip-crown-2-fill text-base leading-none" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-charcoal">{name}</div>
                  <div className="text-sm text-gray-500">{roleLabel ? roleLabel : '—'}</div>
                </div>

                <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
              </button>
            )
          })}

          {groups.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">{t('groups.manage.empty')}</div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

function safeInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
