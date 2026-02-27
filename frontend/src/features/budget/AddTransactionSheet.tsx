import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { domusApi, type CreateFinanceTransactionRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type Props = {
  token: string
  budgetId: string
  currencyCode: string
  defaultDate: string
  onClose: () => void
  onCreated: () => void
}

type TransactionType = 'Expense' | 'Income'

export function AddTransactionSheet({ token, budgetId, currencyCode, defaultDate, onClose, onCreated }: Props) {
  const titleRef = useRef<HTMLInputElement | null>(null)

  const [type, setType] = useState<TransactionType>('Expense')
  const [title, setTitle] = useState('')
  const [amountText, setAmountText] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [paidByUserId, setPaidByUserId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(true)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.financeCategories(type),
    queryFn: () => domusApi.getFinanceCategories(token, type),
  })

  const accountsQuery = useQuery({
    queryKey: queryKeys.financeAccounts,
    queryFn: () => domusApi.getFinanceAccounts(token),
  })

  const membersQuery = useQuery({
    queryKey: queryKeys.budgetMembers(budgetId),
    queryFn: () => domusApi.getBudgetMembers(token, budgetId),
  })

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const first = categoriesQuery.data?.find((c) => Boolean(c.id))?.id ?? null
    setCategoryId((prev) => (prev ? prev : first))
  }, [categoriesQuery.data])

  useEffect(() => {
    const first = accountsQuery.data?.find((a) => Boolean(a.id))?.id ?? null
    setAccountId((prev) => (prev ? prev : first))
  }, [accountsQuery.data])

  useEffect(() => {
    const me = getUserIdFromAccessToken(token)
    const members = membersQuery.data ?? []
    const best = (me && members.some((m) => m.userId === me) ? me : members.find((m) => Boolean(m.userId))?.userId) ?? null
    setPaidByUserId((prev) => (prev ? prev : best))
  }, [membersQuery.data, token])

  useEffect(() => {
    setCategoryId(null)
  }, [type])

  const amountValue = useMemo(() => {
    const cleaned = amountText.replace(',', '.').trim()
    const n = Number.parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
  }, [amountText])

  const canSave =
    title.trim().length > 0 &&
    amountValue !== null &&
    amountValue > 0 &&
    Boolean(categoryId) &&
    Boolean(accountId) &&
    Boolean(paidByUserId) &&
    !categoriesQuery.isLoading &&
    !accountsQuery.isLoading &&
    !membersQuery.isLoading

  const createMutation = useMutation({
    mutationFn: (req: CreateFinanceTransactionRequest) => domusApi.createBudgetTransaction(token, budgetId, req),
    onSuccess: () => {
      onCreated()
    },
  })

  const errorMessage = useMemo(() => {
    const err = createMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [createMutation.error])

  const submit = () => {
    if (!canSave || amountValue === null || !categoryId || !accountId || !paidByUserId) return

    const request: CreateFinanceTransactionRequest = {
      title: title.trim(),
      amount: amountValue,
      type,
      categoryId,
      accountId,
      paidByUserId,
      date: date || null,
      isPaid,
    }

    createMutation.mutate(request)
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

            <div className="text-base font-semibold">Adicionar transação</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave || createMutation.isPending}
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
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  type === 'Expense' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-charcoal hover:bg-sand-light'
                }`}
                onClick={() => setType('Expense')}
                disabled={createMutation.isPending}
              >
                Despesa
              </button>
              <button
                type="button"
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  type === 'Income' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-charcoal hover:bg-sand-light'
                }`}
                onClick={() => setType('Income')}
                disabled={createMutation.isPending}
              >
                Rendimento
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">Título</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Metro"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-charcoal/60">Valor ({currencyCode.toUpperCase()})</label>
              <input
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-charcoal/60">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-price-tag-3-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Categoria</div>
              </div>
              {categoriesQuery.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <select
                  className="max-w-[55%] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                  disabled={createMutation.isPending || (categoriesQuery.data?.length ?? 0) === 0}
                >
                  {(categoriesQuery.data ?? []).map((c) => {
                    if (!c.id) return null
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name ?? '—'}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-bank-card-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Conta</div>
              </div>
              {accountsQuery.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <select
                  className="max-w-[55%] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                  value={accountId ?? ''}
                  onChange={(e) => setAccountId(e.target.value || null)}
                  disabled={createMutation.isPending || (accountsQuery.data?.length ?? 0) === 0}
                >
                  {(accountsQuery.data ?? []).map((a) => {
                    if (!a.id) return null
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name ?? '—'}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-user-3-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Pago por</div>
              </div>
              {membersQuery.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <select
                  className="max-w-[55%] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
                  value={paidByUserId ?? ''}
                  onChange={(e) => setPaidByUserId(e.target.value || null)}
                  disabled={createMutation.isPending || (membersQuery.data?.length ?? 0) === 0}
                >
                  {(membersQuery.data ?? []).map((m) => {
                    if (!m.userId) return null
                    return (
                      <option key={m.userId} value={m.userId}>
                        {m.name ?? '—'}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-checkbox-circle-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Marcar como paga</div>
              </div>
              <button
                type="button"
                className={`relative h-7 w-12 rounded-full transition ${isPaid ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setIsPaid((v) => !v)}
                disabled={createMutation.isPending}
                aria-label="Marcar como paga"
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    isPaid ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = parts[1]!
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = atob(padded)

    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function getUserIdFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token)
  const sub = payload?.sub
  return typeof sub === 'string' ? sub : null
}

