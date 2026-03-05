import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type ActivityEntryResponse, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { useI18n } from '../../i18n/i18n'
import { formatTimeAgo } from '../../utils/intl'

type Props = {
  token: string
  family: FamilyResponse
}

export function NotificationsPage({ token, family }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const activityKey = useMemo(() => queryKeys.activityAll({ skip: 0, take: 200 }), [])

  const unreadQuery = useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => domusApi.getUnreadNotifications(token, 50),
  })

  const activityQuery = useQuery({
    queryKey: activityKey,
    queryFn: () => domusApi.getActivity(token, { skip: 0, take: 200 }),
  })

  const markAllSeenMutation = useMutation({
    mutationFn: () => domusApi.markAllNotificationsSeen(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread })
      await queryClient.invalidateQueries({ queryKey: activityKey })
    },
  })

  const isLoading = unreadQuery.isLoading || activityQuery.isLoading
  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const apiUnreadError = unreadQuery.error instanceof ApiError ? unreadQuery.error : null
  const apiActivityError = activityQuery.error instanceof ApiError ? activityQuery.error : null

  if (unreadQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiUnreadError}
        queryKey={queryKeys.notificationsUnread}
        queryClient={queryClient}
        title={t('notificationsPage.errorUnreadTitle')}
      />
    )
  }

  if (activityQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiActivityError}
        queryKey={activityKey}
        queryClient={queryClient}
        title={t('notificationsPage.errorActivityTitle')}
      />
    )
  }

  const unread = unreadQuery.data ?? []
  const all = activityQuery.data ?? []

  const unreadById = new Set<string>(unread.flatMap((x) => (x.id ? [x.id] : [])))
  const seen = all.filter((x) => !(x.id && unreadById.has(x.id)))

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="flex items-start justify-between gap-4 bg-linear-to-b from-sage-light to-offwhite py-10 flex-col px-4">
        <nav className="flex w-full items-center justify-between px-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.home')}
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>
        </nav>

        <section className="py-10 px-2">
          <h1 className="text-6xl font-bold text-charcoal mb-4">{t('notificationsPage.title')}</h1>
          <p className="text-md text-gray-600">{t('notificationsPage.subtitle', { familyName: family.name ?? '' })}</p>
        </section>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-16 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-charcoal/70">{t('notificationsPage.unseenCount', { count: unread.length })}</div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 disabled:opacity-50"
            disabled={unread.length === 0 || markAllSeenMutation.isPending}
            onClick={() => markAllSeenMutation.mutate()}
          >
            {markAllSeenMutation.isPending ? (
              <i className="ri-loader-4-line animate-spin text-lg leading-none" />
            ) : (
              <i className="ri-check-double-line text-lg leading-none" />
            )}
            {t('notificationsPage.markAllSeen')}
          </button>
        </div>

        <NotificationSection
          title={t('notificationsPage.section.unseen')}
          emptyText={t('notificationsPage.empty.unseen')}
          items={unread}
          onOpenList={(listId) => navigate(`/lists/items/${listId}`)}
        />

        <NotificationSection
          title={t('notificationsPage.section.seen')}
          emptyText={t('notificationsPage.empty.seen')}
          items={seen}
          onOpenList={(listId) => navigate(`/lists/items/${listId}`)}
        />
      </main>
    </div>
  )
}

function NotificationSection({
  title,
  emptyText,
  items,
  onOpenList,
}: {
  title: string
  emptyText: string
  items: ActivityEntryResponse[]
  onOpenList: (listId: string) => void
}) {
  const { t, locale } = useI18n()

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-forest">{title}</h2>
        <div className="text-xs text-gray-500">{items.length}</div>
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {items.map((x, idx) => (
            <li key={x.id ?? `${title}-${idx}`} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sage-dark text-sage-dark">
                  {safeInitial(x.actorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-charcoal">
                    <strong className="font-semibold">{x.actorName ?? t('common.someone')}</strong> {x.message ?? ''}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{x.createdAtUtc ? formatTimeAgo(x.createdAtUtc, locale) : ''}</span>
                    {x.listId ? (
                      <button
                        type="button"
                        className="text-amber-dark hover:text-amber font-medium"
                        onClick={() => onOpenList(x.listId!)}
                      >
                        {t('notificationsPage.openList')}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-gray-400">{x.kind ?? ''}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-gray-500">{emptyText}</div>
      )}
    </section>
  )
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
