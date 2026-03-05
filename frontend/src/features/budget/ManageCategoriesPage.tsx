import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type FinanceCategoryResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { getFinanceCategoryDisplayName } from '../../utils/categoryLocalization'
import { financeCategoryEmoji } from '../../utils/financeCategoryEmoji'
import { CreateFinanceCategorySheet } from './CreateFinanceCategorySheet'
import { EditFinanceCategorySheet } from './EditFinanceCategorySheet'

type Props = {
  token: string
}

type DragState = {
  categoryId: string
  name: string
  emoji: string
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
}

function sortByOrderThenName(rows: FinanceCategoryResponse[], locale: string): FinanceCategoryResponse[] {
  const collator = new Intl.Collator(locale)
  return [...rows].sort((a, b) => {
    const ao = a.sortOrder ?? 0
    const bo = b.sortOrder ?? 0
    if (ao !== bo) return ao - bo
    return collator.compare(String(a.name ?? ''), String(b.name ?? ''))
  })
}

export function ManageCategoriesPage({ token }: Props) {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale, language } = useI18n()

  const [type, setType] = useState<'Expense' | 'Income'>('Expense')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FinanceCategoryResponse | null>(null)

  const [orderedRows, setOrderedRows] = useState<FinanceCategoryResponse[]>([])
  const orderedRowsRef = useRef<FinanceCategoryResponse[]>([])
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dragStartRowsRef = useRef<FinanceCategoryResponse[] | null>(null)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.financeCategories(type),
    queryFn: () => domusApi.getFinanceCategories(token, type),
  })

  const apiError = categoriesQuery.error instanceof ApiError ? categoriesQuery.error : null

  useEffect(() => {
    orderedRowsRef.current = orderedRows
  }, [orderedRows])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    if (dragStateRef.current) return
    setOrderedRows(sortByOrderThenName(categoriesQuery.data ?? [], locale))
  }, [categoriesQuery.data, locale])

  useEffect(() => {
    setEditingCategory(null)
  }, [type])

  const reorderMutation = useMutation({
    mutationFn: async (vars: { updates: Array<{ categoryId: string; sortOrder: number }>; previousRows?: FinanceCategoryResponse[] }) => {
      await Promise.all(vars.updates.map((u) => domusApi.updateFinanceCategory(token, u.categoryId, { sortOrder: u.sortOrder })))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['financeCategories'] })
    },
    onError: (err, vars) => {
      window.alert(err instanceof Error ? err.message : t('budget.categories.reorder.error'))
      if (vars?.previousRows) setOrderedRows(vars.previousRows)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (vars: { categoryId: string }) => domusApi.deleteFinanceCategory(token, vars.categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['financeCategories'] })
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('budget.categories.delete.error'))
    },
  })

  useEffect(() => {
    if (!dragState?.categoryId) return

    const onMove = (ev: PointerEvent) => {
      const current = dragStateRef.current
      if (!current) return

      setDragState((prev) => (prev ? { ...prev, x: ev.clientX, y: ev.clientY } : prev))

      const all = orderedRowsRef.current
      const ids = all.map((c) => c.id).filter(Boolean) as string[]
      const draggingId = current.categoryId
      const without = ids.filter((id) => id !== draggingId)

      let insertionIndex = without.length
      for (let i = 0; i < without.length; i++) {
        const id = without[i]
        const el = rowRefs.current[id]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        if (ev.clientY < mid) {
          insertionIndex = i
          break
        }
      }

      setOrderedRows((prev) => {
        const dragged = prev.find((c) => c.id === draggingId)
        if (!dragged) return prev

        const remaining = prev.filter((c) => c.id !== draggingId)
        const next = [...remaining.slice(0, insertionIndex), dragged, ...remaining.slice(insertionIndex)]
        const same = next.length === prev.length && next.every((c, idx) => c.id === prev[idx]?.id)
        return same ? prev : next
      })

      if (ev.clientY < 80) window.scrollBy(0, -14)
      else if (ev.clientY > window.innerHeight - 80) window.scrollBy(0, 14)
    }

    const onUp = () => {
      const prevRows = dragStartRowsRef.current
      dragStartRowsRef.current = null
      dragStateRef.current = null
      setDragState(null)

      if (!prevRows) return

      const prevIds = prevRows.map((c) => c.id).filter(Boolean) as string[]
      const nextRows = orderedRowsRef.current
      const nextIds = nextRows.map((c) => c.id).filter(Boolean) as string[]
      const changed = prevIds.length !== nextIds.length || prevIds.some((id, idx) => id !== nextIds[idx])
      if (!changed) return

      const updates = nextRows
        .filter((c) => Boolean(c.id))
        .map((c, idx) => ({ categoryId: c.id!, sortOrder: idx }))
        .filter((u) => {
          const prev = prevRows.find((c) => c.id === u.categoryId)
          return (prev?.sortOrder ?? null) !== u.sortOrder
        })

      if (updates.length === 0) return
      reorderMutation.mutate({ updates, previousRows: prevRows })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragState?.categoryId, reorderMutation])

  return (
    <div className="min-h-screen w-full bg-offwhite pb-28">
      <header className="bg-linear-to-b from-sage-light to-offwhite pt-8">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pb-6">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 hover:bg-white text-sage-dark"
            aria-label={t('common.back')}
            onClick={() => (budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/'))}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>

          <div className="text-lg font-bold text-forest">{t('budget.categories.manage.title')}</div>
          <div className="h-11 w-11" />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4">
        <div className="rounded-2xl bg-gray-100 p-1 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${type === 'Expense' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60 hover:bg-white/60'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              onClick={() => setType('Expense')}
              disabled={reorderMutation.isPending || Boolean(dragState)}
            >
              {t('budget.type.expense')}
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${type === 'Income' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60 hover:bg-white/60'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              onClick={() => setType('Income')}
              disabled={reorderMutation.isPending || Boolean(dragState)}
            >
              {t('budget.type.income')}
            </button>
          </div>
        </div>

        <section className="mt-5">
          {categoriesQuery.isLoading ? (
            <div className="py-10 text-center">
              <LoadingSpinner />
            </div>
          ) : categoriesQuery.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">{t('budget.categories.manage.errorTitle')}</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-red-500/20 bg-white/40 p-3 text-xs text-red-800">
                {apiError ? JSON.stringify(apiError.body, null, 2) : String(categoriesQuery.error)}
              </pre>
              <button
                type="button"
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.financeCategories(type) })}
              >
                {t('common.tryAgain')}
              </button>
            </div>
          ) : orderedRows.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-charcoal/70 shadow-sm">
              {t('budget.categories.manage.empty')}
            </div>
          ) : (
            <div className="gap-3 flex flex-col">
              {orderedRows.map((c, idx) => {
                const emoji = financeCategoryEmoji({ iconKey: c.iconKey ?? null, name: c.name ?? null, type })
                const rawName = (c.name ?? '').trim()
                const name = getFinanceCategoryDisplayName({ type, iconKey: c.iconKey ?? null, name: rawName, language }) || '—'
                const isDragging = Boolean(dragState?.categoryId && c.id && dragState.categoryId === c.id)
                const actionsDisabled =
                  reorderMutation.isPending || deleteMutation.isPending || Boolean(dragState) || Boolean(editingCategory)
                return (
                  <div
                    key={c.id ?? `c-${idx}`}
                    ref={(el) => {
                      if (!c.id) return
                      rowRefs.current[c.id] = el
                    }}
                    className={`flex items-center justify-between gap-4 px-3 py-1.5 rounded-2xl border border-gray-200 last:border-b-0 ${isDragging ? 'opacity-30' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-7 w-7 place-items-center rounded-2xl text-lg">{emoji}</div>
                      <div className="truncate font-bold text-charcoal">{name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-sand-light disabled:opacity-50"
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        disabled={actionsDisabled || !c.id}
                        onClick={() => {
                          if (!c.id) return
                          setEditingCategory(c)
                        }}
                      >
                        <i className="ri-pencil-line text-xl" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        disabled={actionsDisabled || !c.id}
                        onClick={() => {
                          if (!c.id) return
                          const ok = window.confirm(t('budget.categories.delete.confirm'))
                          if (!ok) return
                          deleteMutation.mutate({ categoryId: c.id })
                        }}
                      >
                        <i className="ri-delete-bin-line text-xl" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-full text-gray-300 hover:bg-sand-light cursor-grab active:cursor-grabbing disabled:opacity-50"
                        aria-label={t('common.reorder')}
                        title={t('common.reorder')}
                        disabled={actionsDisabled || !c.id}
                        onPointerDown={(e) => {
                          if (actionsDisabled) return
                          if (!c.id) return
                          const el = rowRefs.current[c.id]
                          if (!el) return
                          const rect = el.getBoundingClientRect()
                          dragStartRowsRef.current = orderedRowsRef.current
                          setDragState({
                            categoryId: c.id,
                            name: name.trim() || '—',
                            emoji,
                            x: e.clientX,
                            y: e.clientY,
                            offsetX: e.clientX - rect.left,
                            offsetY: e.clientY - rect.top,
                            width: rect.width,
                          })
                            ; (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
                          e.preventDefault()
                        }}
                      >
                        <i className="ri-menu-line text-2xl" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )
              })}

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-sand-light"
                onClick={() => window.alert(t('common.comingSoon'))}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl">🙈</div>
                  <div className="truncate text-lg font-extrabold text-charcoal">{t('budget.categories.hiddenCategories')}</div>
                </div>
                <i className="ri-arrow-right-s-line text-2xl text-gray-300" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className="place-items-center h-12 w-12 rounded-full bg-amber/90 hover:bg-amber fixed bottom-20 right-20"
        onClick={() => setCreateOpen(true)}
        aria-label={t('common.add')}
        title={t('common.add')}
      >
        <i className="ri-add-large-fill"></i>
      </button>

      {createOpen ? (
        <CreateFinanceCategorySheet
          token={token}
          type={type}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      ) : null}

      {editingCategory ? (
        <EditFinanceCategorySheet
          token={token}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => setEditingCategory(null)}
        />
      ) : null}

      {dragState ? (
        <div
          className="pointer-events-none fixed z-50 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-2xl ring-1 ring-black/5"
          style={{ left: dragState.x - dragState.offsetX, top: dragState.y - dragState.offsetY, width: dragState.width }}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl" aria-hidden="true">
              {dragState.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-extrabold text-charcoal">{dragState.name}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sand-light text-gray-400" aria-hidden="true">
              <i className="ri-drag-move-2-line text-xl" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
