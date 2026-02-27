import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { domusApi, type ActivityEntryResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type Props = {
  token: string
  onClose: () => void
}

function formatUtc(utc: string | null | undefined): string {
  if (!utc) return '—'
  const d = new Date(utc)
  if (Number.isNaN(d.getTime())) return utc
  return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function NotificationRow({ n }: { n: ActivityEntryResponse }) {
  const message = (n.message ?? '').trim() || '—'
  const actor = (n.actorName ?? '').trim() || 'Alguém'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-charcoal">{actor}</div>
      <div className="mt-1 text-sm text-charcoal/80">{message}</div>
      <div className="mt-2 text-xs text-charcoal/50">{formatUtc(n.createdAtUtc)}</div>
    </div>
  )
}

export function NotificationsSheet({ token, onClose }: Props) {
  const queryClient = useQueryClient()

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
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light" onClick={onClose} aria-label="Fechar">
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>
            <div className="text-base font-semibold text-charcoal">Notificações</div>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              onClick={() => markAllSeenMutation.mutate()}
              disabled={markAllSeenMutation.isPending || (notificationsQuery.data?.length ?? 0) === 0}
            >
              Marcar como lidas
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
              <div className="font-semibold">Erro ao obter notificações</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {apiError ? JSON.stringify(apiError.body, null, 2) : errorMessage}
              </pre>
              <button
                type="button"
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread })}
              >
                Tentar novamente
              </button>
            </div>
          ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              Sem notificações por ler.
            </div>
          ) : (
            <div className="space-y-3">
              {(notificationsQuery.data ?? []).map((n, idx) => (
                <NotificationRow key={n.id ?? `n-${idx}`} n={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

