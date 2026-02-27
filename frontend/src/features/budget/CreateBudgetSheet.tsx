import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateBudgetRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { encodeEmojiToIconKey } from '../../utils/emojiIconKey'

type Props = {
  token: string
  defaultCurrencyCode: string
  onClose: () => void
  onCreated: (budgetId: string) => void
}

export function CreateBudgetSheet({ token, defaultCurrencyCode, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)

  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💰')

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const createMutation = useMutation({
    mutationFn: (req: CreateBudgetRequest) => domusApi.createBudget(token, req),
    onSuccess: async (budget) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      const id = budget.id
      if (id) onCreated(id)
    },
  })

  const errorMessage = useMemo(() => {
    const err = createMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [createMutation.error])

  const canSave = Boolean(name.trim()) && !createMutation.isPending

  const submit = () => {
    if (!canSave) return
    const trimmedName = name.trim()
    const iconKey = encodeEmojiToIconKey(emoji) ?? null

    const req: CreateBudgetRequest = {
      name: trimmedName,
      iconKey,
      type: 'Recurring',
      periodType: 'Monthly',
      startDate: todayUtc,
      currencyCode: (defaultCurrencyCode || 'EUR').toUpperCase(),
      visibilityMode: 'AllMembers',
      mainIndicator: 'Balance',
      onlyPaidInTotals: false,
      transactionOrder: 'MostRecentFirst',
      upcomingDisplayMode: 'Expanded',
    }

    createMutation.mutate(req)
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="bg-blue-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={onClose}
              disabled={createMutation.isPending}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <i className="ri-close-line text-2xl leading-none" />
            </button>

            <div className="text-base font-semibold">Criar um novo orçamento</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label="Guardar"
              title="Guardar"
            >
              <i className={createMutation.isPending ? 'ri-loader-4-line animate-spin text-2xl' : 'ri-check-line text-2xl'} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">Nome</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Poupança"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
              disabled={createMutation.isPending}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                submit()
              }}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-emotion-happy-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Ícone (emoji)</div>
              </div>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-lg text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                disabled={createMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-currency-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Moeda</div>
              </div>
              <div className="text-sm font-semibold text-charcoal">{(defaultCurrencyCode || 'EUR').toUpperCase()}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-charcoal/70">
            Por omissão este orçamento é mensal (recorrente).
          </div>
        </div>
      </div>
    </div>
  )
}

