import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { domusApi, type ActivityEntryResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type Props = {
  token: string
  onClose: () => void
}

function formatUtc(utc: string | null | undefined, locale: string): string {
  if (!utc) return '—'
  const d = new Date(utc)
  if (Number.isNaN(d.getTime())) return utc
  return d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

function NotificationRow({ n, locale, someoneLabel }: { n: ActivityEntryResponse; locale: string; someoneLabel: string }) {
  const message = (n.message ?? '').trim() || '—'
  const actor = (n.actorName ?? '').trim() || someoneLabel

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-charcoal">{actor}</div>
      <div className="mt-1 text-sm text-charcoal/80">{message}</div>
      <div className="mt-2 text-xs text-charcoal/50">{formatUtc(n.createdAtUtc, locale)}</div>
    </div>
  )
}

export function NotificationsSheet({ token, onClose }: Props) {
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => domusApi.getUnreadNotifications(token, 50),
  })

  const markAllSeenMutation = useMutation({
    mutationFn: () => domusApi.markAllNotificationsSeen(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread })
      onClose()
    },
  })

  const apiError = notificationsQuery.error instanceof ApiError ? notificationsQuery.error : null

  const errorMessage = useMemo(() => {
    const err = notificationsQuery.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [notificationsQuery.error])

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>
            <div className="text-base font-semibold text-charcoal">{t('notificationsPage.title')}</div>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              onClick={() => markAllSeenMutation.mutate()}
              disabled={markAllSeenMutation.isPending || (notificationsQuery.data?.length ?? 0) === 0}
            >
              {t('notificationsPage.markAllSeen')}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {notificationsQuery.isLoading ? (
            <div className="py-8 text-center">
              <LoadingSpinner />
            </div>
          ) : notificationsQuery.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">{t('notificationsPage.errorUnreadTitle')}</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {apiError ? JSON.stringify(apiError.body, null, 2) : errorMessage}
              </pre>
              <button
                type="button"
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread })}
              >
                {t('common.tryAgain')}
              </button>
            </div>
          ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              {t('notificationsPage.empty.unseen')}
            </div>
          ) : (
            <div className="space-y-3">
              {(notificationsQuery.data ?? []).map((n, idx) => (
                <NotificationRow key={n.id ?? `n-${idx}`} n={n} locale={locale} someoneLabel={t('common.someone')} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
