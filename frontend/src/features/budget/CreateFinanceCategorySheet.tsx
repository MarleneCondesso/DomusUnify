import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateFinanceCategoryRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { encodeEmojiToIconKey } from '../../utils/emojiIconKey'

type Props = {
  token: string
  type: 'Expense' | 'Income'
  onClose: () => void
  onCreated: () => void
}

export function CreateFinanceCategorySheet({ token, type, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)
  const { t } = useI18n()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(type === 'Income' ? '💰' : '🏷️')

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const createMutation = useMutation({
    mutationFn: (req: CreateFinanceCategoryRequest) => domusApi.createFinanceCategory(token, req),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.financeCategories(type) })
      onCreated()
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

    const req: CreateFinanceCategoryRequest = {
      type,
      name: trimmedName,
      iconKey,
    }

    createMutation.mutate(req)
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="bg-blue-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={onClose}
              disabled={createMutation.isPending}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl leading-none" />
            </button>

            <div className="text-base font-semibold">{t('budget.categories.create.title')}</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label={t('common.save')}
              title={t('common.save')}
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
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">{t('common.name')}</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'Income'
                  ? t('budget.categories.create.placeholder.income')
                  : t('budget.categories.create.placeholder.expense')
              }
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
                <div className="text-sm font-medium text-charcoal">{t('budget.categories.iconLabel')}</div>
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
                <i className="ri-price-tag-3-line text-xl text-gray-500" />
                <div className="text-sm font-medium text-charcoal">{t('common.type')}</div>
              </div>
              <div className="text-sm font-semibold text-charcoal">
                {type === 'Income' ? t('budget.type.income') : t('budget.type.expense')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
