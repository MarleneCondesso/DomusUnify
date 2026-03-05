import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategoryListType, CategoryResponse } from '../../api/domusApi'
import { useI18n } from '../../i18n/i18n'
import { getItemCategoryDisplayName } from '../../utils/categoryLocalization'
import { encodeEmojiToIconKey, iconKeyToEmoji } from '../../utils/emojiIconKey'

type CategoryCreateInput = { name: string; type: CategoryListType; iconKey: string }
type CategoryUpdatePatch = { name?: string; type?: CategoryListType; iconKey?: string; sortOrder?: number }

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

type Props = {
  categories: CategoryResponse[]
  initialType?: CategoryListType
  isBusy?: boolean
  errorMessage?: string | null
  onCreate: (input: CategoryCreateInput) => void
  onUpdate: (categoryId: string, patch: CategoryUpdatePatch) => void
  onReorder?: (updates: Array<{ categoryId: string; sortOrder: number }>) => void
  onDelete: (categoryId: string) => void
  onClose: () => void
}

const CATEGORY_TYPES: CategoryListType[] = ['Shopping', 'Tasks', 'Custom']

function normalizeCategoryType(value: unknown): CategoryListType {
  return value === 'Shopping' || value === 'Tasks' || value === 'Custom' ? value : 'Shopping'
}

function iconPreview(iconKey: string | null | undefined): string {
  return iconKeyToEmoji(iconKey) ?? '🏷️'
}

function suggestedEmojis(type: CategoryListType): string[] {
  if (type === 'Tasks')
    return ['👨‍🍳', '🛏️', '🛋️', '👩‍💻', '🧺', '🚮', '🛁', '🚪', '🧹', '🧽', '🧴', '🧼']
  if (type === 'Custom') return ['🏷️', '⭐️', '📌', '✅', '💡', '🧩', '🧾', '🗂️']
  return ['🍣', '🍎', '🍗', '🍞', '🥛', '❄️', '🌾', '🧃', '🧂', '🍫', '🧴', '🧼', '🐶', '🍽️']
}

type IconPickerTarget = { kind: 'new' } | { kind: 'edit' }

export function ManageCategoriesSheet({
  categories,
  initialType = 'Shopping',
  isBusy,
  errorMessage,
  onCreate,
  onUpdate,
  onReorder,
  onDelete,
  onClose,
}: Props) {
  const { t, language } = useI18n()
  const [selectedType, setSelectedType] = useState<CategoryListType>(normalizeCategoryType(initialType))

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newIconKey, setNewIconKey] = useState('tag')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingType, setEditingType] = useState<CategoryListType>('Shopping')
  const [editingIconKey, setEditingIconKey] = useState('tag')

  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [iconPickerTarget, setIconPickerTarget] = useState<IconPickerTarget>({ kind: 'new' })
  const [iconPickerType, setIconPickerType] = useState<CategoryListType>('Shopping')
  const [iconDraft, setIconDraft] = useState('')

  const [orderedRows, setOrderedRows] = useState<CategoryResponse[]>([])
  const orderedRowsRef = useRef<CategoryResponse[]>([])
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const dragStartRowsRef = useRef<CategoryResponse[] | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  const baseRows = useMemo(() => {
    return categories
      .filter((c) => Boolean(c.id))
      .filter((c) => normalizeCategoryType(c.type) === selectedType)
      .slice()
      .sort((a, b) => {
        const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        if (byOrder !== 0) return byOrder
        const aName = a.name ?? ''
        const bName = b.name ?? ''
        return aName.localeCompare(bName, undefined, { sensitivity: 'base' })
      })
  }, [categories, selectedType])

  const typeLabel = (type: CategoryListType): string => {
    if (type === 'Shopping') return t('lists.create.type.shopping')
    if (type === 'Tasks') return t('lists.create.type.tasks')
    return t('lists.create.type.custom')
  }

  const busy = Boolean(isBusy) || Boolean(dragState)

  useEffect(() => {
    orderedRowsRef.current = orderedRows
  }, [orderedRows])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    if (dragStateRef.current) return
    setOrderedRows(baseRows)
  }, [baseRows])

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

      const container = scrollContainerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        const margin = 80
        if (ev.clientY < rect.top + margin) container.scrollBy({ top: -14 })
        else if (ev.clientY > rect.bottom - margin) container.scrollBy({ top: 14 })
      }
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
      if (onReorder) onReorder(updates)
      else updates.forEach((u) => onUpdate(u.categoryId, { sortOrder: u.sortOrder }))
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragState?.categoryId, onReorder, onUpdate])

  const openIconPicker = (target: IconPickerTarget, type: CategoryListType, currentIconKey: string) => {
    setIconPickerTarget(target)
    setIconPickerType(type)
    setIconDraft(iconPreview(currentIconKey))
    setIconPickerOpen(true)
  }

  const applyIconDraft = () => {
    const trimmed = iconDraft.trim()
    const iconKey = trimmed ? encodeEmojiToIconKey(trimmed) : 'tag'
    if (!iconKey) {
      window.alert(t('lists.manageCategories.iconPicker.invalidEmoji'))
      return
    }

    if (iconPickerTarget.kind === 'new') setNewIconKey(iconKey)
    if (iconPickerTarget.kind === 'edit') setEditingIconKey(iconKey)
    setIconPickerOpen(false)
  }

  const submitCreate = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed || busy) return

    onCreate({ name: trimmed, type: selectedType, iconKey: newIconKey || 'tag' })
    setNewCategoryName('')
    setNewIconKey('tag')
  }

  const submitEdit = (categoryId: string) => {
    const trimmed = editingName.trim()
    if (!trimmed || busy) return

    onUpdate(categoryId, { name: trimmed, type: editingType, iconKey: editingIconKey || 'tag' })
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-white sm:inset-x-[10%] sm:bottom-8 sm:top-8 sm:rounded-3xl sm:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} title={t('common.close')}>
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="flex items-center gap-2 text-base font-semibold text-charcoal">
            {t('lists.manageCategories.title')}
            {isBusy ? <i className="ri-loader-4-line animate-spin text-lg text-charcoal/60" /> : null}
          </div>
          <span className="h-10 w-10" />
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]"
        >
            <div className="mb-4 flex items-center justify-center">
              <div className="inline-flex rounded-full bg-sand-light p-1">
              {CATEGORY_TYPES.map((type) => {
                const active = selectedType === type
                return (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/70 hover:text-charcoal'
                    }`}
                    onClick={() => setSelectedType(type)}
                    disabled={busy}
                  >
                    {typeLabel(type)}
                  </button>
                )
              })}
            </div>
          </div>

          {errorMessage ? (
            <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-sand-light"
                title={t('lists.manageCategories.iconPicker.title')}
                onClick={() => openIconPicker({ kind: 'new' }, selectedType, newIconKey)}
                disabled={busy}
              >
                <span className="text-xl leading-none">{iconPreview(newIconKey)}</span>
              </button>

              <input
                className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
                placeholder={t('lists.manageCategories.new.placeholder')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  submitCreate()
                }}
                disabled={busy}
              />

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-forest text-white disabled:opacity-50"
                onClick={submitCreate}
                disabled={busy || newCategoryName.trim().length === 0}
                aria-label={t('lists.manageCategories.addAria')}
                title={t('common.add')}
              >
                <i className="ri-check-line text-xl" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {orderedRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-charcoal/70">
                {t('lists.manageCategories.empty', { type: typeLabel(selectedType) })}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {orderedRows.map((c) => {
                  const id = c.id
                  if (!id) return null

                  const isEditing = editingId === id
                  const rawName = (c.name ?? '').trim()
                  const displayName = getItemCategoryDisplayName(c, language).trim() || rawName || t('common.category')
                  const rowType = normalizeCategoryType(c.type)
                  const rowIconKey = (c.iconKey ?? 'tag').toString()
                  const emoji = iconPreview(rowIconKey)
                  const isDragging = Boolean(dragState?.categoryId && dragState.categoryId === id)

                  return (
                    <li
                      key={id}
                      ref={(el) => {
                        rowRefs.current[id] = el
                      }}
                      className={`px-4 py-3 ${isDragging ? 'opacity-30' : ''}`}
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-sand-light"
                              title={t('lists.manageCategories.iconPicker.title')}
                              onClick={() => openIconPicker({ kind: 'edit' }, editingType, editingIconKey)}
                              disabled={busy}
                            >
                              <span className="text-xl leading-none">{iconPreview(editingIconKey)}</span>
                            </button>

                            <input
                              className="w-full bg-transparent py-2 text-base text-charcoal outline-none"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return
                                e.preventDefault()
                                submitEdit(id)
                              }}
                              disabled={busy}
                              autoFocus
                            />

                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-sand-light disabled:opacity-50"
                              onClick={() => submitEdit(id)}
                              disabled={busy || editingName.trim().length === 0}
                              aria-label={t('common.save')}
                              title={t('common.save')}
                            >
                              <i className="ri-check-line text-xl" />
                            </button>
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-sand-light disabled:opacity-50"
                              onClick={() => setEditingId(null)}
                              disabled={busy}
                              aria-label={t('common.cancel')}
                              title={t('common.cancel')}
                            >
                              <i className="ri-close-line text-xl" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pl-1 text-sm text-charcoal/70">
                            <span className="text-xs uppercase tracking-wide">{t('common.type')}</span>
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none"
                              value={editingType}
                              onChange={(e) => setEditingType(normalizeCategoryType(e.target.value))}
                              disabled={busy}
                            >
                              {CATEGORY_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {typeLabel(type)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="text-xl leading-none">{emoji}</span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-charcoal">{displayName}</div>
                              <div className="text-xs text-charcoal/60">{typeLabel(rowType)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-gray-300 hover:bg-sand-light disabled:opacity-50 cursor-grab active:cursor-grabbing"
                              aria-label={t('common.reorder')}
                              disabled={busy || Boolean(editingId)}
                              onPointerDown={(e) => {
                                if (busy) return
                                if (editingId) return
                                const el = rowRefs.current[id]
                                if (!el) return
                                const rect = el.getBoundingClientRect()
                                dragStartRowsRef.current = orderedRowsRef.current
                                setDragState({
                                  categoryId: id,
                                  name: displayName.trim() || '—',
                                  emoji,
                                  x: e.clientX,
                                  y: e.clientY,
                                  offsetX: e.clientX - rect.left,
                                  offsetY: e.clientY - rect.top,
                                  width: rect.width,
                                })
                                ;(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
                                e.preventDefault()
                              }}
                            >
                              <i className="ri-menu-line text-2xl" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-sand-light disabled:opacity-50"
                              onClick={() => {
                                setEditingId(id)
                                setEditingName(rawName)
                                setEditingType(rowType)
                                setEditingIconKey(rowIconKey || 'tag')
                              }}
                              disabled={busy}
                              aria-label={t('common.edit')}
                              title={t('common.edit')}
                            >
                              <i className="ri-pencil-line text-xl" />
                            </button>
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50"
                              onClick={() => {
                                const ok = window.confirm(t('lists.manageCategories.delete.confirm'))
                                if (!ok) return
                                onDelete(id)
                              }}
                              disabled={busy}
                              aria-label={t('common.delete')}
                              title={t('common.delete')}
                            >
                              <i className="ri-delete-bin-line text-xl" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {iconPickerOpen ? (
        <div className="fixed inset-0 z-60">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIconPickerOpen(false)}
            aria-label={t('common.close')}
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl sm:inset-x-[20%] sm:bottom-10 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-charcoal">{t('lists.manageCategories.iconPicker.title')}</div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-sand-light"
                onClick={() => setIconPickerOpen(false)}
                aria-label={t('common.close')}
              >
                <i className="ri-close-line text-2xl text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-xl leading-none">{iconDraft.trim() ? iconDraft.trim() : '🏷️'}</span>
              <input
                className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
                placeholder={t('lists.manageCategories.iconPicker.placeholder')}
                value={iconDraft}
                onChange={(e) => setIconDraft(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-forest text-white"
                onClick={applyIconDraft}
                aria-label={t('common.apply')}
                title={t('common.apply')}
              >
                <i className="ri-check-line text-xl" />
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-charcoal/60">
                {t('lists.manageCategories.iconPicker.suggestions', { type: typeLabel(iconPickerType) })}
              </div>
              <div className="grid grid-cols-8 gap-2">
                {suggestedEmojis(iconPickerType).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-gray-200 bg-white text-xl hover:bg-sand-light"
                    onClick={() => {
                      setIconDraft(emoji)
                      const iconKey = encodeEmojiToIconKey(emoji)
                      if (!iconKey) return
                      if (iconPickerTarget.kind === 'new') setNewIconKey(iconKey)
                      if (iconPickerTarget.kind === 'edit') setEditingIconKey(iconKey)
                      setIconPickerOpen(false)
                    }}
                    aria-label={t('lists.manageCategories.iconPicker.selectEmoji', { emoji })}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-sand-light"
                  onClick={() => {
                    if (iconPickerTarget.kind === 'new') setNewIconKey('tag')
                    if (iconPickerTarget.kind === 'edit') setEditingIconKey('tag')
                    setIconPickerOpen(false)
                  }}
                >
                  {t('lists.manageCategories.iconPicker.useTag')}
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"
                  onClick={applyIconDraft}
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {dragState ? (
        <div
          className="pointer-events-none fixed z-[70] rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-2xl ring-1 ring-black/5"
          style={{ left: dragState.x - dragState.offsetX, top: dragState.y - dragState.offsetY, width: dragState.width }}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-2xl" aria-hidden="true">
              {dragState.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-extrabold text-charcoal">{dragState.name}</div>
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
