import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type FinanceAccountResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { CreateFinanceAccountSheet } from './CreateFinanceAccountSheet'

type Props = {
  token: string
}

function sortByOrderThenName(rows: FinanceAccountResponse[]): FinanceAccountResponse[] {
  return [...rows].sort((a, b) => {
    const ao = a.sortOrder ?? 0
    const bo = b.sortOrder ?? 0
    if (ao !== bo) return ao - bo
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-PT')
  })
}

export function ManageAccountsPage({ token }: Props) {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)

  const accountsQuery = useQuery({
    queryKey: queryKeys.financeAccounts,
    queryFn: () => domusApi.getFinanceAccounts(token),
  })

  const apiError = accountsQuery.error instanceof ApiError ? accountsQuery.error : null

  const rows = useMemo(() => sortByOrderThenName(accountsQuery.data ?? []), [accountsQuery.data])

  return (
    <div className="min-h-screen w-full bg-offwhite pb-28">
      <header className="bg-linear-to-b from-blue-500 to-offwhite pt-8">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pb-6">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 hover:bg-white text-blue-700"
            aria-label="Voltar"
            onClick={() => (budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/'))}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>

          <div className="text-lg font-extrabold text-white">Gerenciar contas</div>
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
              <div className="font-semibold">Erro ao obter contas</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {apiError ? JSON.stringify(apiError.body, null, 2) : String(accountsQuery.error)}
              </pre>
              <button
                type="button"
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.financeAccounts })}
              >
                Tentar novamente
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              Sem contas.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              {rows.map((a, idx) => {
                const emoji = iconKeyToEmoji(a.iconKey ?? null) ?? '🏦'
                return (
                  <div
                    key={a.id ?? `a-${idx}`}
                    className="flex items-center justify-between gap-4 px-4 py-4 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">{emoji}</div>
                      <div className="truncate text-lg font-extrabold text-charcoal">{a.name ?? '—'}</div>
                    </div>
                    <i className="ri-menu-line text-2xl text-gray-300" aria-hidden="true" />
                  </div>
                )
              })}

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-sand-light"
                onClick={() => window.alert('Em breve.')}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">🙈</div>
                  <div className="truncate text-lg font-extrabold text-charcoal">Categorias ocultas</div>
                </div>
                <i className="ri-arrow-right-s-line text-2xl text-gray-300" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className="fixed inset-x-0 bottom-6 mx-auto flex w-[min(720px,calc(100%-32px))] items-center justify-center gap-3 rounded-full bg-blue-500 px-6 py-4 text-lg font-extrabold text-white shadow-2xl hover:bg-blue-600"
        onClick={() => setCreateOpen(true)}
      >
        <i className="ri-add-line text-2xl" aria-hidden="true" />
        Nova conta
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

