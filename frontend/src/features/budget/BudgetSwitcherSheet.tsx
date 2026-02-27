import { useQuery, useQueryClient } from '@tanstack/react-query'
import { domusApi } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'

type Props = {
  token: string
  selectedBudgetId: string
  onClose: () => void
  onSelectBudget: (budgetId: string) => void
  onCreateBudget: () => void
}

export function BudgetSwitcherSheet({ token, selectedBudgetId, onClose, onSelectBudget, onCreateBudget }: Props) {
  const queryClient = useQueryClient()

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: () => domusApi.getBudgets(token),
  })

  const apiError = budgetsQuery.error instanceof ApiError ? budgetsQuery.error : null

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-charcoal">Mudar orçamento</div>
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} aria-label="Fechar">
            <i className="ri-close-line text-xl text-gray-600" />
          </button>
        </div>

        {budgetsQuery.isLoading ? (
          <div className="py-6 text-center">
            <LoadingSpinner />
          </div>
        ) : budgetsQuery.isError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            <div className="font-semibold">Erro ao obter orçamentos</div>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
              {apiError ? JSON.stringify(apiError.body, null, 2) : String(budgetsQuery.error)}
            </pre>
            <button
              type="button"
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.budgets })}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {(budgetsQuery.data ?? [])
              .filter((b) => Boolean(b.id))
              .map((b) => {
                const budgetId = b.id!
                const isSelected = budgetId === selectedBudgetId
                const emoji = iconKeyToEmoji(b.iconKey ?? null) ?? '💰'

                return (
                  <button
                    key={budgetId}
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-sand-light"
                    onClick={() => onSelectBudget(budgetId)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand-light text-xl">
                        <span aria-hidden="true">{emoji}</span>
                      </div>
                      <div className={`truncate text-base font-semibold ${isSelected ? 'text-blue-600' : 'text-charcoal'}`}>
                        {b.name ?? '—'}
                      </div>
                    </div>

                    {isSelected ? <i className="ri-check-line text-2xl text-blue-600" aria-hidden="true" /> : null}
                  </button>
                )
              })}

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-sand-light"
              onClick={onCreateBudget}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand-light text-xl">
                  <span aria-hidden="true">🐷</span>
                </div>
                <div className="truncate text-base font-semibold text-charcoal">Criar um novo orçamento</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

