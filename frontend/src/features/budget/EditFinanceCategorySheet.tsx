import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type FinanceCategoryResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { encodeEmojiToIconKey, iconKeyToEmoji } from '../../utils/emojiIconKey'
import { financeCategoryEmoji } from '../../utils/financeCategoryEmoji'

type Props = {
  token: string
  category: FinanceCategoryResponse
  onClose: () => void
  onSaved: () => void
}

export function EditFinanceCategorySheet({ token, category, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)

  const categoryId = category.id ?? null
  const type = (category.type === 'Income' ? 'Income' : 'Expense') as 'Expense' | 'Income'
  const initialName = (category.name ?? '').trim()
  const fallbackEmoji = financeCategoryEmoji({ iconKey: null, name: initialName, type })
  const initialEmoji = iconKeyToEmoji(category.iconKey ?? null) ?? fallbackEmoji

  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const updateMutation = useMutation({
    mutationFn: async (vars: { name: string; iconKey: string | null }) => {
      if (!categoryId) throw new Error('Categoria inválida.')
      return domusApi.updateFinanceCategory(token, categoryId, { name: vars.name, iconKey: vars.iconKey })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['financeCategories'] })
      onSaved()
    },
  })

  const errorMessage = useMemo(() => {
    const err = updateMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return String(err)
  }, [updateMutation.error])

  const canSave = Boolean(name.trim()) && !updateMutation.isPending

  const submit = () => {
    if (!canSave) return
    const trimmedName = name.trim()
    const trimmedEmoji = emoji.trim()
    const iconKey = trimmedEmoji ? encodeEmojiToIconKey(trimmedEmoji) : null
    if (trimmedEmoji && !iconKey) {
      window.alert('Emoji inválido (ou demasiado longo).')
      return
    }

    updateMutation.mutate({ name: trimmedName, iconKey })
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="bg-blue-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={onClose}
              disabled={updateMutation.isPending}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <i className="ri-close-line text-2xl leading-none" />
            </button>

            <div className="text-base font-semibold">Editar categoria</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label="Guardar"
              title="Guardar"
            >
              <i className={updateMutation.isPending ? 'ri-loader-4-line animate-spin text-2xl' : 'ri-check-line text-2xl'} />
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
              placeholder={type === 'Income' ? 'Ex.: Salário' : 'Ex.: Transporte'}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25"
              disabled={updateMutation.isPending}
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
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-price-tag-3-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">Tipo</div>
              </div>
              <div className="text-sm font-semibold text-charcoal">{type === 'Income' ? 'Renda' : 'Despesas'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

