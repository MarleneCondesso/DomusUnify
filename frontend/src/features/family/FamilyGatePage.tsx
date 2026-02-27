import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { domusApi } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import type { FamilyResponse } from '../../api/domusApi'
import { DashboardPage } from '../dashboard/DashboardPage'
import { CalendarPage } from '../calendar/calendar'
import { ListsPage } from '../lists/ListsPage'
import { CreateListPage } from '../lists/CreateListPage'
import { ListItemsPage } from '../lists/ListItemsPage'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

type Props = {
  token: string
  onLogout: () => void
}

/**
 * "Gate" (portão) que garante que o utilizador autenticado tem:
 * - um token JWT válido
 * - uma "família atual" definida (contexto usado pela maioria dos endpoints)
 *
 * Depois disso, renderiza o resto da app (ex.: Listas).
 */
export function FamilyGatePage({ token, onLogout }: Props) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.familyMe,
    queryFn: () => domusApi.getMyFamily(token),
  })

  // Alguns erros são "esperados" no fluxo (ex.: ainda não tens família atual).
  const apiError = meQuery.error instanceof ApiError ? meQuery.error : null
  const isNoCurrentFamily = apiError?.status === 404
  const isUnauthorized = apiError?.status === 401

  if (isUnauthorized) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold">Sessão expirada</h2>
        <p className="mt-2 text-sm text-charcoal/70">O token já não é aceite pela API. Faz login novamente.</p>
        <button
          className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
          onClick={onLogout}
          type="button"
        >
          Voltar ao login
        </button>
      </div>
    )
  }

  if (meQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (meQuery.isError && !isNoCurrentFamily) {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">Erro ao obter família atual</h2>
        <pre className="mt-3 whitespace-pre-wrap wrap-break-words rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white">
          {apiError ? JSON.stringify(apiError.body, null, 2) : String(meQuery.error)}
        </pre>
        <button
          className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.familyMe })}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isNoCurrentFamily) {
    return <NoCurrentFamily token={token} />
  }

  const family = meQuery.data!
  return (
    <Routes>
      <Route path="/" element={<DashboardPage token={token} family={family} />} />
      <Route path="/calendar" element={<CalendarPage token={token} family={family} />} />
      <Route path="/lists" element={<ListsPage token={token} family={family} onLogout={onLogout} />} />
      <Route path="/lists/new" element={<CreateListPage token={token} family={family} onLogout={onLogout} />} />
      <Route path="/lists/items/:listId" element={<ListItemsPage token={token} family={family} onLogout={onLogout}/>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function NoCurrentFamily({ token }: { token: string }) {
  const queryClient = useQueryClient()
  const [newFamilyName, setNewFamilyName] = useState('')

  const familiesQuery = useQuery({
    queryKey: queryKeys.familiesMy,
    queryFn: () => domusApi.getMyFamilies(token),
  })

  const createFamilyMutation = useMutation({
    mutationFn: () => domusApi.createFamily(token, { name: newFamilyName }),
    onSuccess: (family) => {
      // Como o backend define automaticamente a família criada como atual,
      // podemos colocar já na cache e seguir o fluxo.
      queryClient.setQueryData<FamilyResponse>(queryKeys.familyMe, family)
      queryClient.invalidateQueries({ queryKey: queryKeys.familiesMy })
    },
  })

  const setCurrentMutation = useMutation({
    mutationFn: (familyId: string) => domusApi.setCurrentFamily(token, { familyId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyMe })
    },
  })

  const errorMessage = useMemo(() => {
    const err = createFamilyMutation.error || setCurrentMutation.error || familiesQuery.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    return 'Erro inesperado.'
  }, [createFamilyMutation.error, familiesQuery.error, setCurrentMutation.error])

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <h2 className="text-xl font-semibold text-charcoal">Não possui nenhuma família.</h2>
      <p className="mt-2 text-sm text-charcoal/70">
        Podes criar uma nova ou selecionar uma existente.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Criar nova</h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createFamilyMutation.mutate()
            }}
          >
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70">Nome da família</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-forest text-charcoal"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                required
              />
            </label>
            <button
              className="w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-forest/40"
              type="submit"
              disabled={createFamilyMutation.isPending}
            >
              Criar família
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-charcoal">Selecionar existente</h3>
          {familiesQuery.isLoading && (
            <div className="mt-3">
              <LoadingSpinner />
            </div>
          )}

          {familiesQuery.data?.length === 0 && (
            <p className="mt-3 text-sm text-charcoal">Ainda não pertences a nenhuma família.</p>
          )}

          <ul className="mt-3 space-y-2">
            {familiesQuery.data?.map((f) => {
              // O OpenAPI não marca `id` como required, por isso o tipo vem como opcional.
              // Na prática, o backend devolve sempre o `id`. Mesmo assim, protegemos o UI.
              const familyId = f.id
              if (!familyId) return null

              return (
                <li
                  key={familyId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-sand-light bg-amber px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">{f.name}</div>
                    <div className="text-sm text-white/70">Role: {f.role}</div>
                  </div>
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => setCurrentMutation.mutate(familyId)}
                    disabled={setCurrentMutation.isPending}
                  >
                    Definir como atual
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          Erro: {errorMessage}
        </div>
      )}
    </div>
  )
}
