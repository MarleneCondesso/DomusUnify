import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateFinanceAccountRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { encodeEmojiToIconKey } from '../../utils/emojiIconKey'

type Props = {
  token: string
  onClose: () => void
  onCreated: () => void
}

export function CreateFinanceAccountSheet({ token, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const nameRef = useRef<HTMLInputElement | null>(null)
  const { t } = useI18n()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏦')

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const createMutation = useMutation({
    mutationFn: (req: CreateFinanceAccountRequest) => domusApi.createFinanceAccount(token, req),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.financeAccounts }),
        queryClient.invalidateQueries({ queryKey: ['budgetAccountsVisible'] }),
      ])
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

    const req: CreateFinanceAccountRequest = {
      type: 'Checking',
      name: trimmedName,
      iconKey,
    }

    createMutation.mutate(req)
  }

  return (
    <div className="fixed inset-0 z-90">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>
            <div className="text-base font-semibold text-charcoal">{t('budget.accounts.create.title')}</div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label={t('common.save')}
              title={t('common.save')}
            >
              <i className={createMutation.isPending ? 'ri-loader-4-line animate-spin text-2xl text-blue-600' : 'ri-check-line text-2xl text-blue-600'} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-10 bg-transparent text-center text-2xl outline-none"
                  aria-label={t('budget.accounts.create.iconLabel')}
                  disabled={createMutation.isPending}
                />
              </div>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('budget.accounts.create.namePlaceholder')}
                className="w-full border-0 bg-transparent text-lg font-semibold text-charcoal outline-none"
                disabled={createMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  submit()
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
