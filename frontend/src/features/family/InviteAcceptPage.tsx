import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type Props = {
  token: string
}

export function InviteAcceptPage({ token }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { t, locale } = useI18n()

  const previewQuery = useQuery({
    queryKey: ['familyInvitePreview', inviteToken ?? 'unknown'],
    queryFn: () => domusApi.previewFamilyInvite(token, inviteToken!),
    enabled: Boolean(inviteToken),
  })

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!inviteToken) throw new Error(t('invite.accept.invalid.title'))
      await domusApi.joinFamilyInvite(token, inviteToken)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy }),
        queryClient.invalidateQueries({ queryKey: queryKeys.familyMe }),
      ])
      navigate('/', { replace: true })
    },
    onError: (err) => {
      window.alert(err instanceof ApiError ? JSON.stringify(err.body) : err instanceof Error ? err.message : t('invite.accept.errorAccept'))
    },
  })

  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-offwhite w-full">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
              aria-label={t('common.close')}
              onClick={() => navigate('/')}
            >
              <i className="ri-close-line text-2xl leading-none text-sage-dark" />
            </button>
            <div className="text-lg font-bold text-charcoal">{t('invite.accept.title')}</div>
            <div className="h-12 w-12" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12">
          <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-600">
              <i className="ri-error-warning-line text-3xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-charcoal mb-2">{t('invite.accept.invalid.title')}</h1>
            <p className="text-sm text-gray-600">{t('invite.accept.invalid.subtitle')}</p>
          </div>
        </main>
      </div>
    )
  }

  const apiError = previewQuery.error instanceof ApiError ? previewQuery.error : null

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={t('common.close')}
            onClick={() => navigate('/')}
          >
            <i className="ri-close-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">{t('invite.accept.title')}</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12">
        {previewQuery.isLoading ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm text-center text-sm text-gray-500">
            <i className="ri-loader-4-line animate-spin text-xl mr-2" />
            {t('invite.accept.loading')}
          </div>
        ) : null}

        {previewQuery.isError ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700">
            {t('invite.accept.loadError')}
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
              {apiError ? JSON.stringify(apiError.body, null, 2) : String(previewQuery.error)}
            </pre>
            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
              onClick={() => previewQuery.refetch()}
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : null}

        {previewQuery.data ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-sand-light text-sage-dark">
                <i className="ri-group-line text-3xl" />
              </div>
              <h1 className="text-2xl font-extrabold text-charcoal mb-2">
                {t('invite.accept.inviteFor')}{' '}
                <span className="text-forest">{previewQuery.data.familyName ?? '—'}</span>
              </h1>
              <p className="text-sm text-gray-600">
                {t('invite.accept.sentBy')}{' '}
                <span className="font-semibold text-charcoal">{previewQuery.data.invitedByName}</span>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {t('invite.link.expires', { date: formatExpiry(previewQuery.data.expiresAtUtc, locale) })}
              </p>
            </div>

            {previewQuery.data.isRevoked ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                {t('invite.accept.revoked')}
              </div>
            ) : null}

            {previewQuery.data.isExpired ? (
              <div className="mt-3 rounded-2xl border border-amber/30 bg-amber/15 px-4 py-3 text-sm text-amber-dark">
                {t('invite.accept.expired')}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-forest px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => joinMutation.mutate()}
              disabled={previewQuery.data.isExpired || previewQuery.data.isRevoked || joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" /> {t('invite.accept.accepting')}
                </span>
              ) : (
                t('invite.accept.accept')
              )}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  )
}

function formatExpiry(isoUtc: string | undefined, locale: string): string {
  if (!isoUtc) return '—'
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc
  return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}
