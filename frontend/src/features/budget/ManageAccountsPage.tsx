import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type FinanceAccountResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { SwipeableRow } from '../../ui/SwipeableRow'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { CreateFinanceAccountSheet } from './CreateFinanceAccountSheet'

type Props = {
  token: string
}

function sortByOrderThenName(rows: FinanceAccountResponse[], locale: string): FinanceAccountResponse[] {
  const collator = new Intl.Collator(locale)
  return [...rows].sort((a, b) => {
    const ao = a.sortOrder ?? 0
    const bo = b.sortOrder ?? 0
    if (ao !== bo) return ao - bo
    return collator.compare(String(a.name ?? ''), String(b.name ?? ''))
  })
}

export function ManageAccountsPage({ token }: Props) {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()

  const [createOpen, setCreateOpen] = useState(false)
  const [hidingAccountIds, setHidingAccountIds] = useState<Set<string>>(() => new Set())

  const visibleQueryKey = budgetId ? queryKeys.budgetAccountsVisible(budgetId) : (['budgetAccountsVisible', null] as const)
  const hiddenQueryKey = budgetId ? queryKeys.budgetAccountsHidden(budgetId) : (['budgetAccountsHidden', null] as const)

  const accountsQuery = useQuery({
    queryKey: visibleQueryKey,
    queryFn: () => domusApi.getBudgetVisibleAccounts(token, budgetId!),
    enabled: Boolean(budgetId),
  })

  const hideMutation = useMutation({
    mutationFn: (accountId: string) => domusApi.hideBudgetAccount(token, budgetId!, accountId),
    onSuccess: async () => {
      setHidingAccountIds(new Set())

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: visibleQueryKey }),
        queryClient.invalidateQueries({ queryKey: hiddenQueryKey }),
      ])
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('budget.accounts.hide.error'))
      setHidingAccountIds(new Set())
    },
  })

  const apiError = accountsQuery.error instanceof ApiError ? accountsQuery.error : null

  const rows = useMemo(() => sortByOrderThenName(accountsQuery.data ?? [], locale), [accountsQuery.data, locale])

  return (
    <div className="min-h-screen w-full bg-offwhite pb-28">
      <header className="bg-linear-to-b from-sage-light to-offwhite pt-8">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pb-6">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.back')}
            onClick={() => (budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/'))}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>

          <div className="text-lg font-extrabold text-forest">{t('budget.accounts.manage.title')}</div>
          <div className="h-11 w-11" />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4">
        <section className="mt-2">
          {accountsQuery.isLoading ? (
            <div className="py-10 text-center">
              <LoadingSpinner />
            </div>
          ) : accountsQuery.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">{t('budget.accounts.manage.errorTitle')}</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {apiError ? JSON.stringify(apiError.body, null, 2) : String(accountsQuery.error)}
              </pre>
              <button
                type="button"
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: visibleQueryKey })}
              >
                {t('common.tryAgain')}
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              {t('budget.accounts.manage.empty')}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              {rows.map((a, idx) => {
                const emoji = iconKeyToEmoji(a.iconKey ?? null) ?? '🏦'
                const accountId = a.id ?? null
                const isHiding = accountId ? hidingAccountIds.has(accountId) : false
                const canHide = Boolean(accountId) && !isHiding && !hideMutation.isPending && Boolean(budgetId)

                return (
                  <SwipeableRow
                    key={accountId ?? `a-${idx}`}
                    className="border-b border-gray-200 last:border-b-0 bg-sand-light/40"
                    disabled={!canHide}
                    threshold={108}
                    rightAction={
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-sage-dark text-white">
                        <i className="ri-eye-off-line text-xl" aria-hidden="true" />
                      </div>
                    }
                    onSwipedLeft={
                      canHide
                        ? () => {
                            if (!accountId) return

                            const confirmed = window.confirm(t('budget.accounts.hide.confirm'))
                            if (!confirmed) return

                            setHidingAccountIds((prev) => {
                              const next = new Set(prev)
                              next.add(accountId)
                              return next
                            })

                            hideMutation.mutate(accountId)
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-4 bg-white px-4 py-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">{emoji}</div>
                        <div className="truncate text-lg font-extrabold text-charcoal">{a.name ?? '—'}</div>
                      </div>
                      <i
                        className={
                          isHiding
                            ? 'ri-loader-4-line animate-spin text-2xl text-gray-300'
                            : 'ri-menu-line text-2xl text-gray-300'
                        }
                        aria-hidden="true"
                      />
                    </div>
                  </SwipeableRow>
                )
              })}

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-sand-light"
                onClick={() => (budgetId ? navigate(`/budgets/${budgetId}/accounts/hidden`) : window.alert(t('common.comingSoon')))}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">🙈</div>
                  <div className="truncate text-lg font-extrabold text-charcoal">{t('budget.accounts.hiddenAccounts')}</div>
                </div>
                <i className="ri-arrow-right-s-line text-2xl text-gray-300" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className="fixed bottom-20 right-6 grid h-14 w-14 place-items-center rounded-full bg-amber/60 text-charcoal shadow-2xl hover:bg-amber"
        onClick={() => setCreateOpen(true)}
        aria-label={t('common.add')}
        title={t('common.add')}
      >
        <i className="ri-add-line text-2xl" aria-hidden="true" />
      </button>

      {createOpen ? (
        <CreateFinanceAccountSheet
          token={token}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  )
}
