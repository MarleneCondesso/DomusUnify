import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { domusApi, type CreateListRequest, type FamilyResponse } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type CreateListPageProps = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

export function CreateListPage({ token, family, onLogout }: CreateListPageProps) {

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  type ListType = 'Shopping' | 'Tasks' | 'Custom'
  type VisibilityMode = 'AllMembers' | 'SpecificMembers' | 'Private'

  //#region ...[Form State]...
  const [name, setName] = useState('')
  const [type, setType] = useState<ListType>('Shopping')
  const [colorHex, setColorHex] = useState('#4f46e5')
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('AllMembers')
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([])
  //#endregion

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
        colorHex,
        visibilityMode,
        allowedUserIds: visibilityMode === 'SpecificMembers' ? allowedUserIds : null,
      }

      return domusApi.createList(token, request)
    },
    onSuccess: async () => {
      setName('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      navigate('/lists', { replace: true })
    },
  })
  //#endregion

  const errorMessage = useMemo(() => {
    const err = createListMutation.error ?? membersQuery.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    return 'Erro inesperado.'
  }, [createListMutation.error, membersQuery.error])

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(type) &&
    Boolean(colorHex.trim()) &&
    (visibilityMode !== 'SpecificMembers' || allowedUserIds.length > 0)

  return (
    <div className="min-h-screen bg-offwhite w-full px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Create new list</h2>
            <p className="mt-1 text-sm text-charcoal/70">Family: {family.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-gray-300 bg-white/60 px-3 py-2 text-sm text-charcoal hover:bg-white"
              type="button"
              onClick={() => navigate('/lists')}
            >
              Back
            </button>
            <button
              className="rounded-xl border border-white/10 bg-amber px-3 py-2 text-sm hover:bg-amber/40"
              type="button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createListMutation.mutate()
          }}
        >
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70">List name</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70">Type</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
                value={type}
                onChange={(e) => setType(e.target.value as ListType)}
              >
                <option value="Shopping">Shopping</option>
                <option value="Tasks">Tasks</option>
                <option value="Custom">Custom</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-charcoal/70">Color</span>
              <input
                className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                aria-label="List color"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70">Visible to</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
              value={visibilityMode}
              onChange={(e) => {
                const next = e.target.value as VisibilityMode
                setVisibilityMode(next)
                if (next !== 'SpecificMembers') setAllowedUserIds([])
              }}
            >
              <option value="AllMembers">Everyone in the family</option>
              <option value="SpecificMembers">Specific members</option>
              <option value="Private">Only me (private)</option>
            </select>
          </label>

          {visibilityMode === 'SpecificMembers' && (
            <div className="rounded-xl border border-gray-300 bg-white/20 px-3 py-3">
              <div className="text-xs font-medium text-charcoal/70">Select members</div>

              {membersQuery.isLoading ? (
                <div className="mt-3">
                  <LoadingSpinner size="sm" label="Loading members..." />
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
                    <div className="text-sm text-charcoal/70">No members found.</div>
                  )}
                </div>
              )}

              {allowedUserIds.length === 0 && (
                <div className="mt-2 text-xs text-charcoal/70">
                  Select at least 1 member (you will always have access).
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-charcoal">
              Error: {errorMessage}
            </div>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-forest/40"
            type="submit"
            disabled={!canSubmit || createListMutation.isPending}
          >
            {createListMutation.isPending ? <LoadingSpinner size="sm" label="Creating..." /> : 'Create list'}
          </button>
        </form>
      </div>
    </div>
  )
}
