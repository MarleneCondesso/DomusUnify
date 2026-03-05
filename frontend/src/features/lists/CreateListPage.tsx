import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { domusApi, type CreateListRequest, type FamilyResponse } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { useI18n } from '../../i18n/i18n'

type CreateListPageProps = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

export function CreateListPage({ token, family }: CreateListPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  type ListType = 'Shopping' | 'Tasks' | 'Custom'
  type VisibilityMode = 'AllMembers' | 'SpecificMembers' | 'Private'

  type NavState = {
    backgroundLocation?: Location
  }

  const backgroundLocation = (location.state as NavState | null)?.backgroundLocation

  //#region ...[Form State]...
  const [name, setName] = useState('')
  const [type, setType] = useState<ListType>('Shopping')
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('AllMembers')
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([])
  //#endregion

  const nameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const membersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
    enabled: visibilityMode === 'SpecificMembers',
  })

  //#region ...[Create List Mutation]...
  const createListMutation = useMutation({
    mutationFn: () => {
      const request: CreateListRequest = {
        name,
        type,
        visibilityMode,
        allowedUserIds: visibilityMode === 'SpecificMembers' ? allowedUserIds : null,
      }

      return domusApi.createList(token, request)
    },
    onSuccess: async () => {
      setName('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      if (backgroundLocation) {
        navigate(-1)
      } else {
        navigate('/lists', { replace: true })
      }
    },
  })
  //#endregion

  const onClose = () => {
    if (createListMutation.isPending) return

    if (backgroundLocation) {
      navigate(-1)
    } else {
      navigate('/lists', { replace: true })
    }
  }

  const errorMessage = useMemo(() => {
    const err = createListMutation.error ?? membersQuery.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    return t('common.unexpectedError')
  }, [createListMutation.error, membersQuery.error, t])

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(type) &&
    (visibilityMode !== 'SpecificMembers' || allowedUserIds.length > 0)

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        className="absolute inset-0 bg-black/40 disabled:cursor-not-allowed"
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        disabled={createListMutation.isPending}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="p-4 pb-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

          <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-charcoal">{t('lists.create.title')}</div>
              <div className="mt-1 truncate text-xs text-charcoal/60">{t('lists.create.familyLine', { familyName: family.name ?? '' })}</div>
            </div>

            <button
              type="button"
              className="rounded-full p-2 hover:bg-sand-light disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClose}
              aria-label={t('common.close')}
              disabled={createListMutation.isPending}
            >
              <i className="ri-close-line text-xl text-gray-600" />
            </button>
          </div>
        </div>

        <form
          className="flex-1 overflow-y-auto space-y-4 p-4 pt-0 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          onSubmit={(e) => {
            e.preventDefault()
            createListMutation.mutate()
          }}
        >
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70">{t('lists.create.name.label')}</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createListMutation.isPending}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70">{t('lists.create.type.label')}</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
                value={type}
                onChange={(e) => setType(e.target.value as ListType)}
                disabled={createListMutation.isPending}
              >
                <option value="Shopping">{t('lists.create.type.shopping')}</option>
                <option value="Tasks">{t('lists.create.type.tasks')}</option>
                <option value="Custom">{t('lists.create.type.custom')}</option>
              </select>
            </label>

          </div>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70">{t('lists.create.visibility.label')}</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
              value={visibilityMode}
              onChange={(e) => {
                const next = e.target.value as VisibilityMode
                setVisibilityMode(next)
                if (next !== 'SpecificMembers') setAllowedUserIds([])
              }}
              disabled={createListMutation.isPending}
            >
              <option value="AllMembers">{t('lists.create.visibility.all')}</option>
              <option value="SpecificMembers">{t('lists.create.visibility.specific')}</option>
              <option value="Private">{t('lists.create.visibility.private')}</option>
            </select>
          </label>

          {visibilityMode === 'SpecificMembers' && (
            <div className="rounded-xl border border-gray-300 bg-white/20 px-3 py-3">
              <div className="text-xs font-medium text-charcoal/70">{t('lists.create.members.title')}</div>

              {membersQuery.isLoading ? (
                <div className="mt-3">
                  <LoadingSpinner size="sm" label={t('lists.create.members.loading')} />
                </div>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {membersQuery.data?.map((m) => {
                    if (!m.userId) return null
                    const checked = allowedUserIds.includes(m.userId)

                    return (
                      <label
                        key={m.userId}
                        className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white/30 px-3 py-2 text-sm text-charcoal"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={createListMutation.isPending}
                          onChange={(e) => {
                            const isChecked = e.target.checked
                            setAllowedUserIds((prev) =>
                              isChecked ? Array.from(new Set([...prev, m.userId!])) : prev.filter((x) => x !== m.userId),
                            )
                          }}
                        />
                        <span className="truncate">{m.name ?? m.email ?? m.userId}</span>
                      </label>
                    )
                  })}

                  {membersQuery.data?.length === 0 && (
                    <div className="text-sm text-charcoal/70">{t('lists.create.members.none')}</div>
                  )}
                </div>
              )}

              {allowedUserIds.length === 0 && (
                <div className="mt-2 text-xs text-charcoal/70">
                  {t('lists.create.members.requireOne')}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-charcoal">
              {t('common.error')}: {errorMessage}
            </div>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-forest/40"
            type="submit"
            disabled={!canSubmit || createListMutation.isPending}
          >
            {createListMutation.isPending ? <LoadingSpinner size="sm" label={t('common.creating')} /> : t('lists.create.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
