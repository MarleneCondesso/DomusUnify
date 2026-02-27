import { useMemo, useState } from 'react'
import type { CategoryListType, CategoryResponse } from '../../api/domusApi'
import { encodeEmojiToIconKey, iconKeyToEmoji } from '../../utils/emojiIconKey'

type CategoryCreateInput = { name: string; type: CategoryListType; iconKey: string }
type CategoryUpdatePatch = { name?: string; type?: CategoryListType; iconKey?: string }

type Props = {
  categories: CategoryResponse[]
  initialType?: CategoryListType
  isBusy?: boolean
  errorMessage?: string | null
  onCreate: (input: CategoryCreateInput) => void
  onUpdate: (categoryId: string, patch: CategoryUpdatePatch) => void
  onDelete: (categoryId: string) => void
  onClose: () => void
}

const CATEGORY_TYPES: CategoryListType[] = ['Shopping', 'Tasks', 'Custom']

function normalizeCategoryType(value: unknown): CategoryListType {
  return value === 'Shopping' || value === 'Tasks' || value === 'Custom' ? value : 'Shopping'
}

function typeLabel(type: CategoryListType): string {
  if (type === 'Shopping') return 'Shopping'
  if (type === 'Tasks') return 'Tasks'
  return 'Custom'
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
  onDelete,
  onClose,
}: Props) {
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

  const rows = useMemo(() => {
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
      window.alert('Emoji inválido (ou demasiado longo).')
      return
    }

    if (iconPickerTarget.kind === 'new') setNewIconKey(iconKey)
    if (iconPickerTarget.kind === 'edit') setEditingIconKey(iconKey)
    setIconPickerOpen(false)
  }

  const submitCreate = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed || isBusy) return

    onCreate({ name: trimmed, type: selectedType, iconKey: newIconKey || 'tag' })
    setNewCategoryName('')
    setNewIconKey('tag')
  }

  const submitEdit = (categoryId: string) => {
    const trimmed = editingName.trim()
    if (!trimmed || isBusy) return

    onUpdate(categoryId, { name: trimmed, type: editingType, iconKey: editingIconKey || 'tag' })
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 top-0 bg-white sm:inset-x-[10%] sm:bottom-8 sm:top-8 sm:rounded-3xl sm:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} title="Fechar">
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="flex items-center gap-2 text-base font-semibold text-charcoal">
            Gerenciar categorias
            {isBusy ? <i className="ri-loader-4-line animate-spin text-lg text-charcoal/60" /> : null}
          </div>
          <span className="h-10 w-10" />
        </div>

        <div className="px-4 pb-6">
          <div className="mb-4 flex items-center justify-center">
            <div className="inline-flex rounded-full bg-sand-light p-1">
              {CATEGORY_TYPES.map((t) => {
                const active = selectedType === t
                return (
                  <button
                    key={t}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/70 hover:text-charcoal'
                    }`}
                    onClick={() => setSelectedType(t)}
                    disabled={isBusy}
                  >
                    {typeLabel(t)}
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
                title="Selecionar ícone"
                onClick={() => openIconPicker({ kind: 'new' }, selectedType, newIconKey)}
                disabled={isBusy}
              >
                <span className="text-xl leading-none">{iconPreview(newIconKey)}</span>
              </button>

              <input
                className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
                placeholder="Nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  submitCreate()
                }}
                disabled={isBusy}
              />

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-forest text-white disabled:opacity-50"
                onClick={submitCreate}
                disabled={isBusy || newCategoryName.trim().length === 0}
                aria-label="Adicionar categoria"
                title="Adicionar"
              >
                <i className="ri-check-line text-xl" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {rows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-charcoal/70">
                Sem categorias para {typeLabel(selectedType)}.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {rows.map((c) => {
                  const id = c.id
                  if (!id) return null

                  const isEditing = editingId === id
                  const name = c.name ?? 'Categoria'
                  const rowType = normalizeCategoryType(c.type)
                  const rowIconKey = (c.iconKey ?? 'tag').toString()

                  return (
                    <li key={id} className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-sand-light"
                              title="Selecionar ícone"
                              onClick={() => openIconPicker({ kind: 'edit' }, editingType, editingIconKey)}
                              disabled={isBusy}
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
                              disabled={isBusy}
                              autoFocus
                            />

                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-sand-light disabled:opacity-50"
                              onClick={() => submitEdit(id)}
                              disabled={isBusy || editingName.trim().length === 0}
                              aria-label="Guardar"
                              title="Guardar"
                            >
                              <i className="ri-check-line text-xl" />
                            </button>
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-sand-light disabled:opacity-50"
                              onClick={() => setEditingId(null)}
                              disabled={isBusy}
                              aria-label="Cancelar"
                              title="Cancelar"
                            >
                              <i className="ri-close-line text-xl" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pl-1 text-sm text-charcoal/70">
                            <span className="text-xs uppercase tracking-wide">Tipo</span>
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none"
                              value={editingType}
                              onChange={(e) => setEditingType(normalizeCategoryType(e.target.value))}
                              disabled={isBusy}
                            >
                              {CATEGORY_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {typeLabel(t)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="text-xl leading-none">{iconPreview(rowIconKey)}</span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-charcoal">{name}</div>
                              <div className="text-xs text-charcoal/60">{typeLabel(rowType)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-sand-light disabled:opacity-50"
                              onClick={() => {
                                setEditingId(id)
                                setEditingName(name)
                                setEditingType(rowType)
                                setEditingIconKey(rowIconKey || 'tag')
                              }}
                              disabled={isBusy}
                              aria-label="Editar"
                              title="Editar"
                            >
                              <i className="ri-pencil-line text-xl" />
                            </button>
                            <button
                              type="button"
                              className="grid h-10 w-10 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50"
                              onClick={() => {
                                const ok = window.confirm('Eliminar esta categoria?')
                                if (!ok) return
                                onDelete(id)
                              }}
                              disabled={isBusy}
                              aria-label="Eliminar"
                              title="Eliminar"
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
            aria-label="Fechar seletor de ícones"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl sm:inset-x-[20%] sm:bottom-10 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-charcoal">Selecionar ícone</div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-sand-light"
                onClick={() => setIconPickerOpen(false)}
                aria-label="Fechar"
              >
                <i className="ri-close-line text-2xl text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-xl leading-none">{iconDraft.trim() ? iconDraft.trim() : '🏷️'}</span>
              <input
                className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
                placeholder="Cola/Escolhe um emoji"
                value={iconDraft}
                onChange={(e) => setIconDraft(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-forest text-white"
                onClick={applyIconDraft}
                title="Aplicar"
              >
                <i className="ri-check-line text-xl" />
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-charcoal/60">
                Sugestões ({typeLabel(iconPickerType)})
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
                    aria-label={`Selecionar ${emoji}`}
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
                  Usar etiqueta
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"
                  onClick={applyIconDraft}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
