import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { domusApi, type CategoryResponse, type FamilyResponse, type ListItemResponse, type ListResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useFamilyHub } from '../../realtime/useFamilyHub'
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet'
import { BottomSheetPicker, type BottomSheetOption } from '../../ui/BottomSheetPicker'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { SwipeableRow } from '../../ui/SwipeableRow'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { fileToDataUrl } from '../../utils/fileToDataUrl'
import { AddBottomSheet } from './AddBottomSheet'
import { EditListSheet } from './EditListSheet'
import { ItemDetails } from './ItemDetails'
import { ManageCategoriesSheet } from './ManageCategoriesSheet'

type DetailsState = { kind: 'create' } | { kind: 'edit'; itemId: string }
type PickerTarget = 'create' | 'edit'
type SortMode = 'default' | 'name-asc' | 'name-desc'
type ListType = 'Shopping' | 'Tasks' | 'Custom'

const UNCATEGORIZED_ID = '__uncategorized__'
const LONG_PRESS_MS = 260
const DRAG_CANCEL_DISTANCE_PX = 10

type DragState = {
  itemId: string
  itemName: string
  pointerId: number
  originCategoryId: string | null
  targetKey: string
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
}

type PressState = {
  timerId: number
  pointerId: number
  startX: number
  startY: number
  itemId: string
  itemName: string
  originCategoryId: string | null
  originKey: string
  element: HTMLDivElement
}

function normalizeListType(value: unknown): ListType {
  return value === 'Shopping' || value === 'Tasks' || value === 'Custom' ? value : 'Shopping'
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.all(batch.map(fn))
  }
}

type ListItemsPageProps = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

export function ListItemsPage({ token, family }: ListItemsPageProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { listId } = useParams<{ listId: string }>()

  const addInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [isAddBottomSheetOpen, setIsAddBottomSheetOpen] = useState(false)

  useEffect(() => {
    if (!listId) return

    const params = new URLSearchParams(location.search)
    if (params.get('add') !== '1') return

    setIsAddBottomSheetOpen(true)

    params.delete('add')
    const nextSearch = params.toString()
    navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true })
  }, [listId, location.pathname, location.search, navigate])

  const [newItemName, setNewItemName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [editItemName, setEditItemName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [editAssigneeUserId, setEditAssigneeUserId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false)
  const [categoryPickerTarget, setCategoryPickerTarget] = useState<PickerTarget>('create')
  const [assigneePickerTarget, setAssigneePickerTarget] = useState<PickerTarget>('create')
  const [photoPickerTarget, setPhotoPickerTarget] = useState<PickerTarget>('create')
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isDetailsNoteOpen, setIsDetailsNoteOpen] = useState(false)
  const [detailsState, setDetailsState] = useState<DetailsState | null>(null)
  const [togglingItemIds, setTogglingItemIds] = useState<Set<string>>(() => new Set())
  const [movingItemIds, setMovingItemIds] = useState<Set<string>>(() => new Set())
  const [deletingItemIds, setDeletingItemIds] = useState<Set<string>>(() => new Set())

  const [isListOptionsOpen, setIsListOptionsOpen] = useState(false)
  const [isEditListOpen, setIsEditListOpen] = useState(false)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false)
  const [isSortPickerOpen, setIsSortPickerOpen] = useState(false)
  const [isEditListTypePickerOpen, setIsEditListTypePickerOpen] = useState(false)

  const [editListName, setEditListName] = useState('')
  const [editListType, setEditListType] = useState<ListType>('Custom')
  const [editListColorHex, setEditListColorHex] = useState('#16a34a')

  const [filterCategoryId, setFilterCategoryId] = useState<string | typeof UNCATEGORIZED_ID | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [collapsedCategoryKeys, setCollapsedCategoryKeys] = useState<Set<string>>(() => new Set())

  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const sectionHeaderRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const dropSectionKeysRef = useRef<string[]>([])

  const suppressClickRef = useRef(false)
  const pressRef = useRef<PressState | null>(null)
  const lastClientYRef = useRef<number | null>(null)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    return () => {
      if (pressRef.current) {
        window.clearTimeout(pressRef.current.timerId)
        pressRef.current = null
      }
    }
  }, [])

  const closeDetails = () => {
    setDetailsState(null)
    setIsDetailsNoteOpen(false)
  }

  const openPhotoPicker = (target: PickerTarget) => {
    setPhotoPickerTarget(target)
    photoInputRef.current?.click()
  }

  const openCreateDetails = () => {
    setIsDetailsNoteOpen(false)
    setDetailsState({ kind: 'create' })
  }

  const openEditDetails = (item: ListItemResponse) => {
    if (!item.id) return

    setIsCompleted(item.isCompleted ?? false);
    setEditItemName(item.name ?? '')
    setEditCategoryId(item.categoryId ?? null)
    setEditAssigneeUserId(item.assigneeUserId ?? null)
    setEditNote(item.note ?? '')
    setEditPhotoFile(null)
    setEditPhotoUrl(item.photoUrl ?? null)
    setIsDetailsNoteOpen(false)
    setDetailsState({ kind: 'edit', itemId: item.id })
  }

  //#region ...[SignalR]...
  const familyId = family.id ?? ''
  useFamilyHub({ token, familyId, enabled: Boolean(family.id) })
  //#endregion

  //#region ...[Queries]...
  const listsQuery = useQuery({
    queryKey: queryKeys.lists,
    queryFn: () => domusApi.getLists(token),
    enabled: Boolean(family.id),
  })

  const listsCategoriesQuery = useQuery({
    queryKey: queryKeys.listItemsCategories,
    queryFn: () => domusApi.getListCategories(token),
  })

  const listItemsQuery = useQuery({
    queryKey: queryKeys.listItems(listId ?? ''),
    queryFn: () => domusApi.getListItems(token, listId ?? ''),
    enabled: Boolean(family.id && listId),
  })

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
    enabled: Boolean(family.id),
  })
  //#endregion

  const currentList: ListResponse | null = useMemo(() => {
    const id = listId ?? ''
    if (!id) return null
    return listsQuery.data?.find((l) => l.id === id) ?? null
  }, [listId, listsQuery.data])

  const openEditList = () => {
    setEditListName(currentList?.name ?? '')
    setEditListType(normalizeListType(currentList?.type ?? 'Custom'))

    const color = (currentList?.colorHex ?? '').trim()
    setEditListColorHex(isHexColor(color) ? color : '#16a34a')

    setIsEditListOpen(true)
  }

  const listItems = listItemsQuery.data ?? []
  const listItemsCategories = listsCategoriesQuery.data ?? []
  const familyMembers = familyMembersQuery.data ?? []

  const activeListType: ListType = normalizeListType(currentList?.type ?? 'Custom')

  const orderedCategories = useMemo(() => {
    return listItemsCategories
      .filter((c) => Boolean(c.id))
      .slice()
      .sort((a, b) => {
        const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        if (byOrder !== 0) return byOrder
        const aName = a.name ?? ''
        const bName = b.name ?? ''
        return aName.localeCompare(bName, undefined, { sensitivity: 'base' })
      })
  }, [listItemsCategories])

  const categoriesForActiveType = useMemo(() => {
    return orderedCategories.filter((c) => normalizeListType(c.type) === activeListType)
  }, [activeListType, orderedCategories])

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of listItemsCategories) {
      if (!c.id || !c.name) continue
      const emoji = iconKeyToEmoji(c.iconKey)
      map.set(c.id, emoji ? `${emoji} ${c.name}` : c.name)
    }
    return map
  }, [listItemsCategories])

  const categoryOptions: BottomSheetOption[] = useMemo(() => {
    return categoriesForActiveType
      .filter((c) => Boolean(c.id) && Boolean(c.name))
      .map((c) => ({
        id: c.id!,
        label: categoryNameById.get(c.id!) ?? c.name!,
      }))
  }, [categoriesForActiveType, categoryNameById])

  const memberOptions: BottomSheetOption[] = useMemo(() => {
    return familyMembers
      .filter((m) => Boolean(m.userId))
      .map((m) => ({
        id: m.userId!,
        label: m.name ?? m.email ?? m.userId!,
      }))
  }, [familyMembers])

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) return null
    return categoryNameById.get(selectedCategoryId) ?? null
  }, [categoryNameById, selectedCategoryId])

  const selectedAssigneeLabel = useMemo(() => {
    if (!assigneeUserId) return null
    return familyMembers.find((m) => m.userId === assigneeUserId)?.name ?? null
  }, [assigneeUserId, familyMembers])

  const editCategoryLabel = useMemo(() => {
    if (!editCategoryId) return null
    return categoryNameById.get(editCategoryId) ?? null
  }, [categoryNameById, editCategoryId])

  const editAssigneeLabel = useMemo(() => {
    if (!editAssigneeUserId) return null
    return familyMembers.find((m) => m.userId === editAssigneeUserId)?.name ?? null
  }, [editAssigneeUserId, familyMembers])

  const visibleItems = useMemo(() => {
    let next = listItems

    if (hideCompleted) next = next.filter((i) => !i.isCompleted)

    if (filterCategoryId === UNCATEGORIZED_ID) {
      next = next.filter((i) => !i.categoryId)
    } else if (filterCategoryId) {
      next = next.filter((i) => i.categoryId === filterCategoryId)
    }

    if (sortMode !== 'default') {
      const dir = sortMode === 'name-desc' ? -1 : 1
      next = [...next].sort((a, b) => {
        const aName = (a.name ?? '').trim()
        const bName = (b.name ?? '').trim()
        return dir * aName.localeCompare(bName, undefined, { sensitivity: 'base' })
      })
    }

    return next
  }, [filterCategoryId, hideCompleted, listItems, sortMode])

  const itemCountLabel = useMemo(() => {
    if (visibleItems.length === listItems.length) return `${listItems.length} itens`
    return `${visibleItems.length} de ${listItems.length} itens`
  }, [listItems.length, visibleItems.length])

  const canSubmit = Boolean(listId && newItemName.trim().length > 0)
  const canSaveEdit = Boolean(detailsState?.kind === 'edit' && detailsState.itemId && editItemName.trim().length > 0)

  const photoPreviewUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile])
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  const editPhotoPreviewUrl = useMemo(() => (editPhotoFile ? URL.createObjectURL(editPhotoFile) : null), [editPhotoFile])
  useEffect(() => {
    return () => {
      if (editPhotoPreviewUrl) URL.revokeObjectURL(editPhotoPreviewUrl)
    }
  }, [editPhotoPreviewUrl])

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const trimmed = newItemName.trim()
      if (!listId || !trimmed) throw new Error('Invalid item')

      const trimmedNote = note.trim()
      const noteValue = trimmedNote.length > 0 ? trimmedNote : null
      const photoUrl = photoFile ? await fileToDataUrl(photoFile) : null

      return domusApi.addListItem(token, listId, {
        name: trimmed,
        categoryId: selectedCategoryId,
        assigneeUserId,
        note: noteValue,
        photoUrl,
      })
    },
    onSuccess: async () => {
      setNewItemName('')
      setNote('')
      setPhotoFile(null)
      setIsCategoryPickerOpen(false)
      setIsAssigneePickerOpen(false)
      setIsNoteOpen(false)
      setIsDetailsNoteOpen(false)
      setDetailsState(null)

      if (listId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      }

      addInputRef.current?.focus()
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: async (vars: { itemId: string }) => {
      const trimmed = editItemName.trim()
      if (!trimmed) throw new Error('Invalid item')

      const trimmedNote = editNote.trim()
      const noteValue = trimmedNote.length > 0 ? trimmedNote : null
      const photoUrl = editPhotoFile ? await fileToDataUrl(editPhotoFile) : editPhotoUrl

      return domusApi.updateListItem(token, vars.itemId, {
        name: trimmed,
        categoryId: editCategoryId,
        assigneeUserId: editAssigneeUserId,
        note: noteValue,
        photoUrl,
      })
    },
    onSuccess: async () => {
      closeDetails()

      if (listId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      }
    },
  })

  const toggleCompletionMutation = useMutation({
    mutationFn: async (vars: { itemId: string; isCompleted: boolean }) =>
      domusApi.updateListItem(token, vars.itemId, { isCompleted: vars.isCompleted }),
    onMutate: async (vars) => {
      setTogglingItemIds((prev) => {
        const next = new Set(prev)
        next.add(vars.itemId)
        return next
      })

      if (!listId) return undefined

      await queryClient.cancelQueries({ queryKey: queryKeys.listItems(listId) })

      const previous = queryClient.getQueryData<ListItemResponse[]>(queryKeys.listItems(listId))
      queryClient.setQueryData<ListItemResponse[]>(queryKeys.listItems(listId), (current) => {
        const items = current ?? []
        return items.map((it) => (it.id === vars.itemId ? { ...it, isCompleted: vars.isCompleted } : it))
      })

      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (listId && ctx?.previous) queryClient.setQueryData(queryKeys.listItems(listId), ctx.previous)

      if (err instanceof ApiError) {
        const msg = typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        window.alert(msg)
        return
      }
      window.alert(err instanceof Error ? err.message : 'Erro ao marcar item.')
    },
    onSettled: async (_data, _err, vars) => {
      setTogglingItemIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.itemId)
        return next
      })

      if (listId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      }
    },
  })

  const moveItemCategoryMutation = useMutation({
    mutationFn: async (vars: { itemId: string; categoryId: string | null }) =>
      domusApi.updateListItem(token, vars.itemId, { categoryId: vars.categoryId }),
    onMutate: async (vars) => {
      setMovingItemIds((prev) => {
        const next = new Set(prev)
        next.add(vars.itemId)
        return next
      })

      if (!listId) return undefined

      await queryClient.cancelQueries({ queryKey: queryKeys.listItems(listId) })

      const previous = queryClient.getQueryData<ListItemResponse[]>(queryKeys.listItems(listId))
      queryClient.setQueryData<ListItemResponse[]>(queryKeys.listItems(listId), (current) => {
        const items = current ?? []
        return items.map((it) => (it.id === vars.itemId ? { ...it, categoryId: vars.categoryId } : it))
      })

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (!listId) return
      if (ctx?.previous) queryClient.setQueryData(queryKeys.listItems(listId), ctx.previous)
    },
    onSettled: async (_data, _err, vars) => {
      setMovingItemIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.itemId)
        return next
      })

      if (listId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      }
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (vars: { itemId: string }) => domusApi.deleteListItem(token, vars.itemId),
    onMutate: async (vars) => {
      setDeletingItemIds((prev) => {
        const next = new Set(prev)
        next.add(vars.itemId)
        return next
      })

      if (!listId) return undefined

      await queryClient.cancelQueries({ queryKey: queryKeys.listItems(listId) })

      const previous = queryClient.getQueryData<ListItemResponse[]>(queryKeys.listItems(listId))
      queryClient.setQueryData<ListItemResponse[]>(queryKeys.listItems(listId), (current) => {
        const items = current ?? []
        return items.filter((it) => it.id !== vars.itemId)
      })

      return { previous }
    },
    onError: (err, vars, ctx) => {
      if (listId && ctx?.previous) queryClient.setQueryData(queryKeys.listItems(listId), ctx.previous)

      if (err instanceof ApiError) {
        const msg = typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        window.alert(msg)
      } else {
        window.alert(err instanceof Error ? err.message : 'Erro ao eliminar item.')
      }

      setDeletingItemIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.itemId)
        return next
      })
    },
    onSettled: async (_data, _err, vars) => {
      setDeletingItemIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.itemId)
        return next
      })

      if (listId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      }
    },
  })

  const refreshList = async () => {
    if (listId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) })
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
    await queryClient.invalidateQueries({ queryKey: queryKeys.listItemsCategories })
  }

  const updateListMutation = useMutation({
    mutationFn: async () => {
      if (!currentList?.id) throw new Error('Missing list')

      const trimmed = editListName.trim()
      if (!trimmed) throw new Error('Invalid list name')

      const colorHex = isHexColor(editListColorHex) ? editListColorHex : '#16a34a'
      const type = editListType

      await domusApi.updateList(token, currentList.id, { name: trimmed, type, colorHex })
    },
    onSuccess: async () => {
      setIsEditListOpen(false)
      setIsEditListTypePickerOpen(false)
      await refreshList()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        window.alert(msg)
        return
      }
      window.alert(err instanceof Error ? err.message : 'Erro ao atualizar a lista.')
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (input: { name: string; type: ListType; iconKey: string }) => {
      const trimmed = input.name.trim()
      if (!trimmed) throw new Error('Invalid category name')

      const type = normalizeListType(input.type)
      const iconKey = (input.iconKey ?? 'tag').trim() || 'tag'

      const maxSortOrder = listItemsCategories
        .filter((c) => normalizeListType(c.type) === type)
        .reduce((max, c) => Math.max(max, c.sortOrder ?? 0), -1)
      const sortOrder = maxSortOrder + 1

      return domusApi.createItemCategory(token, { name: trimmed, type, iconKey, sortOrder })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listItemsCategories })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async (vars: {
      categoryId: string
      patch: { name?: string; type?: ListType; iconKey?: string; sortOrder?: number }
    }) => {
      const patch: { name?: string; type?: ListType; iconKey?: string; sortOrder?: number } = {}

      if (vars.patch.name !== undefined) {
        const trimmed = vars.patch.name.trim()
        if (!trimmed) throw new Error('Invalid category name')
        patch.name = trimmed
      }

      if (vars.patch.type !== undefined) patch.type = normalizeListType(vars.patch.type)
      if (vars.patch.iconKey !== undefined) patch.iconKey = vars.patch.iconKey
      if (vars.patch.sortOrder !== undefined) patch.sortOrder = vars.patch.sortOrder

      return domusApi.updateItemCategory(token, vars.categoryId, patch)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listItemsCategories })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (vars: { categoryId: string }) => domusApi.deleteItemCategory(token, vars.categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listItemsCategories })
    },
  })

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (vars: { updates: Array<{ categoryId: string; sortOrder: number }> }) => {
      await Promise.all(vars.updates.map((u) => domusApi.updateItemCategory(token, u.categoryId, { sortOrder: u.sortOrder })))
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.listItemsCategories })
      const previous = queryClient.getQueryData<CategoryResponse[]>(queryKeys.listItemsCategories)

      const updatesById = new Map(vars.updates.map((u) => [u.categoryId, u.sortOrder]))
      queryClient.setQueryData<CategoryResponse[]>(queryKeys.listItemsCategories, (current) => {
        const rows = current ?? []
        return rows.map((c) => (c.id && updatesById.has(c.id) ? { ...c, sortOrder: updatesById.get(c.id)! } : c))
      })

      return { previous }
    },
    onError: (err, _vars, ctx) => {
      window.alert(err instanceof Error ? err.message : 'Erro ao reordenar categorias.')
      if (ctx?.previous) queryClient.setQueryData(queryKeys.listItemsCategories, ctx.previous)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listItemsCategories })
    },
  })

  const categoriesErrorMessage = useMemo(() => {
    const err =
      createCategoryMutation.error ||
      updateCategoryMutation.error ||
      deleteCategoryMutation.error ||
      reorderCategoriesMutation.error
    if (!err) return null

    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    return err instanceof Error ? err.message : 'Erro inesperado.'
  }, [
    createCategoryMutation.error,
    deleteCategoryMutation.error,
    reorderCategoriesMutation.error,
    updateCategoryMutation.error,
  ])

  const markAllItemsMutation = useMutation({
    mutationFn: async () => {
      const ids = listItems.filter((i) => Boolean(i.id) && !i.isCompleted).map((i) => i.id!)
      await runInBatches(ids, 6, async (id) => {
        await domusApi.updateListItem(token, id, { isCompleted: true })
      })
    },
    onSuccess: async () => {
      await refreshList()
    },
  })

  const unmarkAllItemsMutation = useMutation({
    mutationFn: async () => {
      const ids = listItems.filter((i) => Boolean(i.id) && i.isCompleted).map((i) => i.id!)
      await runInBatches(ids, 6, async (id) => {
        await domusApi.updateListItem(token, id, { isCompleted: false })
      })
    },
    onSuccess: async () => {
      await refreshList()
    },
  })

  const duplicateListMutation = useMutation({
    mutationFn: async () => {
      const base = (currentList?.name ?? 'Lista').trim() || 'Lista'

      const created = await domusApi.createList(token, {
        name: `${base} (cópia)`,
        type: currentList?.type ?? 'Custom',
        colorHex: currentList?.colorHex ?? '',
        visibilityMode: currentList?.visibilityMode ?? 'AllMembers',
        allowedUserIds: currentList?.allowedUserIds ?? null,
      })

      if (!created.id) throw new Error('Invalid list response')

      const itemsToCopy = listItems
        .filter((i) => (i.name ?? '').trim().length > 0)
        .map((i) => ({
          name: (i.name ?? '').trim(),
          categoryId: i.categoryId ?? null,
          assigneeUserId: i.assigneeUserId ?? null,
          note: i.note ?? null,
          photoUrl: i.photoUrl ?? null,
        }))

      await runInBatches(itemsToCopy, 4, async (item) => {
        await domusApi.addListItem(token, created.id!, item)
      })

      return created
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      if (created.id) navigate(`/lists/items/${created.id}`)
    },
  })

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      if (!listId) throw new Error('Missing listId')
      await domusApi.deleteList(token, listId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      navigate('/lists')
    },
  })

  const filterCategoryLabel = useMemo(() => {
    if (!filterCategoryId) return 'Todos'
    if (filterCategoryId === UNCATEGORIZED_ID) return 'Não classificado'
    return categoryNameById.get(filterCategoryId) ?? 'Categoria'
  }, [categoryNameById, filterCategoryId])

  const sortModeLabel = useMemo(() => {
    if (sortMode === 'name-asc') return 'Nome (A–Z)'
    if (sortMode === 'name-desc') return 'Nome (Z–A)'
    return 'Padrão'
  }, [sortMode])

  const shareList = async () => {
    const title = currentList?.name ?? 'Lista'
    const lines = listItems
      .filter((i) => (i.name ?? '').trim().length > 0)
      .map((i) => {
        const box = i.isCompleted ? '[x]' : '[ ]'
        return `- ${box} ${(i.name ?? '').trim()}`
      })

    const text = `${title}\n\n${lines.join('\n')}`

    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        return
      }
    } catch {
      // ignore -> fallback below
    }

    try {
      await navigator.clipboard.writeText(text)
      window.alert('Lista copiada para o clipboard.')
    } catch {
      window.prompt('Copiar lista:', text)
    }
  }

  const incompleteCount = listItems.filter((i) => Boolean(i.id) && !i.isCompleted).length
  const completedCount = listItems.filter((i) => Boolean(i.id) && i.isCompleted).length

  const filterPickerOptions: BottomSheetOption[] = [
    { id: UNCATEGORIZED_ID, label: 'Não classificado' },
    ...categoryOptions,
  ]

  const sortPickerOptions: BottomSheetOption[] = [
    { id: 'default', label: 'Padrão' },
    { id: 'name-asc', label: 'Nome (A–Z)' },
    { id: 'name-desc', label: 'Nome (Z–A)' },
  ]

  const listOptionsItems: ActionSheetItem[] = [
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: 'ri-refresh-line',
      onPress: () => {
        setIsListOptionsOpen(false)
        void refreshList()
      },
    },
    {
      id: 'edit',
      label: 'Editar lista',
      icon: 'ri-pencil-line',
      disabled: !currentList?.id,
      onPress: () => {
        setIsListOptionsOpen(false)
        openEditList()
      },
    },
    {
      id: 'filter',
      label: 'Filtrar',
      icon: 'ri-filter-3-line',
      right: <span className="text-xs text-charcoal/70">{filterCategoryLabel}</span>,
      onPress: () => {
        setIsListOptionsOpen(false)
        setIsFilterPickerOpen(true)
      },
    },
    {
      id: 'showCategories',
      label: 'Mostrar categorias',
      icon: 'ri-price-tag-3-line',
      right: showCategories ? <i className="ri-check-line text-lg text-forest" /> : null,
      onPress: () => {
        setShowCategories((v) => !v)
        setIsListOptionsOpen(false)
      },
    },
    {
      id: 'manageCategories',
      label: 'Gerenciar categorias',
      icon: 'ri-price-tag-3-fill',
      onPress: () => {
        setIsListOptionsOpen(false)
        setIsManageCategoriesOpen(true)
      },
    },
    {
      id: 'sort',
      label: 'Classificar',
      icon: 'ri-sort-desc',
      right: <span className="text-xs text-charcoal/70">{sortModeLabel}</span>,
      onPress: () => {
        setIsListOptionsOpen(false)
        setIsSortPickerOpen(true)
      },
    },
    {
      id: 'hideCompleted',
      label: 'Ocultar itens concluídos',
      icon: 'ri-eye-off-line',
      right: hideCompleted ? <i className="ri-check-line text-lg text-forest" /> : null,
      onPress: () => {
        setHideCompleted((v) => !v)
        setIsListOptionsOpen(false)
      },
    },
    {
      id: 'markAll',
      label: 'Marcar todos os itens',
      icon: 'ri-checkbox-circle-line',
      disabled: incompleteCount === 0 || markAllItemsMutation.isPending,
      onPress: () => {
        setIsListOptionsOpen(false)
        markAllItemsMutation.mutate()
      },
    },
    {
      id: 'unmarkAll',
      label: 'Desmarcar todos os itens',
      icon: 'ri-checkbox-blank-circle-line',
      disabled: completedCount === 0 || unmarkAllItemsMutation.isPending,
      onPress: () => {
        setIsListOptionsOpen(false)
        unmarkAllItemsMutation.mutate()
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicar lista',
      icon: 'ri-file-copy-line',
      disabled: !currentList?.id || duplicateListMutation.isPending,
      onPress: () => {
        setIsListOptionsOpen(false)
        duplicateListMutation.mutate()
      },
    },
    {
      id: 'share',
      label: 'Enviar esta lista',
      icon: 'ri-send-plane-line',
      onPress: () => {
        setIsListOptionsOpen(false)
        void shareList()
      },
    },
    {
      id: 'delete',
      label: 'Eliminar esta lista',
      icon: 'ri-delete-bin-line',
      tone: 'danger',
      disabled: deleteListMutation.isPending || !listId,
      onPress: () => {
        setIsListOptionsOpen(false)
        if (!listId) return
        const ok = window.confirm('Eliminar esta lista?')
        if (!ok) return
        deleteListMutation.mutate()
      },
    },
  ]

  const groupedSections = showCategories
    ? [
      {
        key: UNCATEGORIZED_ID,
        label: 'Não classificado',
        items: visibleItems.filter((i) => !i.categoryId),
      },
      ...categoriesForActiveType.map((c) => ({
        key: c.id ?? '',
        label: c.id ? categoryNameById.get(c.id) ?? (c.name ?? 'Categoria') : c.name ?? 'Categoria',
        items: visibleItems.filter((i) => i.categoryId === c.id),
      })),
      ...(visibleItems.some((i) => i.categoryId && !categoriesForActiveType.some((c) => c.id === i.categoryId))
        ? [
          {
            key: '__other__',
            label: 'Outras categorias',
            items: visibleItems.filter(
              (i) => i.categoryId && !categoriesForActiveType.some((c) => c.id === i.categoryId),
            ),
          },
        ]
        : []),
    ].filter((s) => Boolean(s.key) && s.items.length > 0)
    : []

  const dropSectionKeys = useMemo(() => groupedSections.map((s) => s.key).filter((key) => Boolean(key)), [groupedSections])

  useEffect(() => {
    dropSectionKeysRef.current = dropSectionKeys
  }, [dropSectionKeys])

  const resolveTargetKey = (clientY: number): string | null => {
    const keys = dropSectionKeysRef.current
    if (keys.length === 0) return null

    const entries: Array<{ key: string; top: number }> = []
    for (const key of keys) {
      const el = sectionHeaderRefs.current[key]
      if (!el) continue
      entries.push({ key, top: el.getBoundingClientRect().top })
    }

    if (entries.length === 0) return null
    entries.sort((a, b) => a.top - b.top)

    let current = entries[0]!.key
    for (const entry of entries) {
      if (clientY >= entry.top - 8) current = entry.key
    }
    return current
  }

  const dragActiveItemId = dragState?.itemId ?? null

  useEffect(() => {
    if (!dragActiveItemId) return
    const prev = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = prev
    }
  }, [dragActiveItemId])

  useEffect(() => {
    if (!dragActiveItemId) return

    let rafId = 0
    const tick = () => {
      const y = lastClientYRef.current
      const scroller = scrollContainerRef.current
      if (y !== null && scroller) {
        const rect = scroller.getBoundingClientRect()
        const topZone = rect.top + 72
        const bottomZone = rect.bottom - 72

        let delta = 0
        if (y < topZone) delta = -Math.min(24, (topZone - y) / 6)
        else if (y > bottomZone) delta = Math.min(24, (y - bottomZone) / 6)

        if (delta !== 0) scroller.scrollTop += delta
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [dragActiveItemId])

  if (listItemsQuery.isLoading || listsCategoriesQuery.isLoading) {
    return <LoadingSpinner size="lg" />
  }

  const toggleSectionCollapsed = (key: string) => {
    setCollapsedCategoryKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const finishDrag = (pointerId: number) => {
    const current = dragStateRef.current
    if (!current) return
    if (current.pointerId !== pointerId) return

    const targetCategoryId =
      current.targetKey === UNCATEGORIZED_ID
        ? null
        : current.targetKey === '__other__'
          ? current.originCategoryId
          : current.targetKey
    if (targetCategoryId !== current.originCategoryId) {
      moveItemCategoryMutation.mutate({ itemId: current.itemId, categoryId: targetCategoryId })
    }

    dragStateRef.current = null
    setDragState(null)
    lastClientYRef.current = null
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  const renderItemRow = (
    item: ListItemResponse,
    rowKey: string,
    options: { showCategoryChip: boolean; sectionKey?: string },
  ) => {
    const itemId = item.id ?? null
    const categoryName = item.categoryId ? categoryNameById.get(item.categoryId) ?? 'Categoria' : 'Não classificado'
    const isCompleted = Boolean(item.isCompleted)
    const isToggling = Boolean(itemId && togglingItemIds.has(itemId))
    const isMoving = Boolean(itemId && movingItemIds.has(itemId))
    const isDeleting = Boolean(itemId && deletingItemIds.has(itemId))
    const categoryMoveEnabled = showCategories && !options.showCategoryChip
    const canMoveCategory = Boolean(itemId) && !isMoving && !isToggling && !isDeleting && dropSectionKeys.length > 0
    const isDragging = Boolean(itemId && dragActiveItemId === itemId)
    const canDelete = Boolean(itemId) && !isMoving && !isToggling && !isDeleting && !dragStateRef.current

    const sectionKey = options.sectionKey ?? (item.categoryId ?? UNCATEGORIZED_ID)

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (!categoryMoveEnabled || !canMoveCategory) return
      if (!itemId) return
      if (dragStateRef.current) return

      if (e.pointerType === 'mouse' && e.button !== 0) return

      const target = e.target as HTMLElement | null
      if (target?.closest('button')) return

      suppressClickRef.current = false

      const pointerId = e.pointerId
      const startX = e.clientX
      const startY = e.clientY
      const element = e.currentTarget
      const originCategoryId = item.categoryId ?? null
      const itemName = item.name ?? 'Item'
      const pressedItemId = itemId

      const timerId = window.setTimeout(() => {
        const press = pressRef.current
        if (!press) return
        if (press.pointerId !== pointerId) return
        if (press.itemId !== pressedItemId) return

        suppressClickRef.current = true
        pressRef.current = null

        const rect = element.getBoundingClientRect()
        const initialTargetKey = press.originKey

        const next: DragState = {
          itemId: press.itemId,
          itemName: press.itemName,
          pointerId,
          originCategoryId: press.originCategoryId,
          targetKey: initialTargetKey,
          x: startX,
          y: startY,
          offsetX: startX - rect.left,
          offsetY: startY - rect.top,
          width: rect.width,
        }

        dragStateRef.current = next
        setDragState(next)
        lastClientYRef.current = startY
        try {
          element.setPointerCapture(pointerId)
        } catch {
          // ignore
        }
      }, LONG_PRESS_MS)

      pressRef.current = {
        timerId,
        pointerId,
        startX,
        startY,
        itemId: pressedItemId,
        itemName,
        originCategoryId,
        originKey: sectionKey,
        element,
      }
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!itemId) return
      const activeItemId = itemId
      const currentDrag = dragStateRef.current
      if (currentDrag && currentDrag.pointerId === e.pointerId && currentDrag.itemId === activeItemId) {
        e.preventDefault()
        lastClientYRef.current = e.clientY
        const targetKey = resolveTargetKey(e.clientY) ?? currentDrag.targetKey
        const next: DragState = { ...currentDrag, x: e.clientX, y: e.clientY, targetKey }
        dragStateRef.current = next
        setDragState(next)
        return
      }

      const press = pressRef.current
      if (!press) return
      if (press.pointerId !== e.pointerId) return
      if (press.itemId !== activeItemId) return

      const dx = e.clientX - press.startX
      const dy = e.clientY - press.startY
      if (Math.hypot(dx, dy) >= DRAG_CANCEL_DISTANCE_PX) {
        window.clearTimeout(press.timerId)
        pressRef.current = null
      }
    }

    const clearPressIfMatchingPointer = (pointerId: number) => {
      const press = pressRef.current
      if (!press) return
      if (press.pointerId !== pointerId) return
      window.clearTimeout(press.timerId)
      pressRef.current = null
    }

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
      if (!itemId) return
      const activeItemId = itemId
      const currentDrag = dragStateRef.current
      if (currentDrag && currentDrag.pointerId === e.pointerId && currentDrag.itemId === activeItemId) {
        e.preventDefault()
        finishDrag(e.pointerId)
        return
      }
      clearPressIfMatchingPointer(e.pointerId)
    }

    const handlePointerCancel = (e: PointerEvent<HTMLDivElement>) => {
      if (!itemId) return
      const activeItemId = itemId
      const currentDrag = dragStateRef.current
      if (currentDrag && currentDrag.pointerId === e.pointerId && currentDrag.itemId === activeItemId) {
        finishDrag(e.pointerId)
        return
      }
      clearPressIfMatchingPointer(e.pointerId)
    }

    const content = (
      <div
        className={`flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md ${isMoving ? 'opacity-60' : ''} ${isDragging ? 'opacity-0' : ''}`}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => {
          if (!categoryMoveEnabled) return
          e.preventDefault()
        }}
        onClickCapture={(e) => {
          if (!suppressClickRef.current) return
          suppressClickRef.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => openEditDetails(item)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          openEditDetails(item)
        }}
      >
        <button
          className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-all ${isCompleted ? 'border-amber bg-amber text-white' : 'border-gray-300 text-forest hover:border-amber'
            } ${isToggling ? 'opacity-60' : ''}`}
          type="button"
          aria-label={isCompleted ? 'Desmarcar item' : 'Marcar item'}
          aria-pressed={isCompleted}
          disabled={isToggling || !itemId}
          onClick={(e) => {
            e.stopPropagation()
            if (!itemId) return
            toggleCompletionMutation.mutate({ itemId, isCompleted: !isCompleted })
          }}
        >
          {isToggling ? (
            <i className="ri-loader-4-line animate-spin text-lg" />
          ) : isCompleted ? (
            <i className="ri-check-line text-lg" />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className={`truncate text-lg font-medium ${isCompleted ? 'text-charcoal/60 line-through' : 'text-charcoal'}`}>
            {item.name ?? 'Item'}
          </h4>
        </div>

        {options.showCategoryChip ? (
          <span className="whitespace-nowrap rounded-full bg-sand-light px-3 py-1 text-xs font-medium text-charcoal">
            {categoryName}
          </span>
        ) : null}

        <button
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-sand"
          type="button"
          aria-label="Mais"
          title="Opções"
          onClick={(e) => {
            e.stopPropagation()
            openEditDetails(item)
          }}
        >
          <i className="ri-more-2-fill text-gray-400" />
        </button>
      </div>
    )

    return (
      <div key={rowKey}>
        <SwipeableRow
          className="rounded-xl bg-red-50"
          disabled={!canDelete}
          threshold={108}
          rightAction={
            <div className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
              <i className="ri-delete-bin-6-line text-xl" aria-hidden="true" />
            </div>
          }
          onSwipedLeft={
            canDelete
              ? () => {
                  if (!itemId) return
                  deleteItemMutation.mutate({ itemId })
                }
              : undefined
          }
        >
          {content}
        </SwipeableRow>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite flex w-full">
      <aside className="hidden w-72 shrink-0 overflow-y-auto bg-forest text-white md:block">
        <div className="flex flex-col gap-2 px-2 py-4">
          <button className="flex items-center gap-4" type="button" onClick={() => navigate('/lists')}>
            <i className="ri-arrow-left-line" />
            <span className="text-sm">Back to Lists</span>
          </button>

          <div className="px-4">
            <h2 className="mb-6 text-2xl font-bold">LIST</h2>

            <div className="mt-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">Filter by category</h3>
              <div className="space-y-2">
                <button
                  className={`w-full cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${filterCategoryId === null ? 'bg-white text-forest' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  type="button"
                  onClick={() => setFilterCategoryId(null)}
                >
                  Todos os itens
                </button>

                <button
                  className={`w-full cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${filterCategoryId === UNCATEGORIZED_ID
                    ? 'bg-white text-forest'
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  type="button"
                  onClick={() => setFilterCategoryId(UNCATEGORIZED_ID)}
                >
                  Não classificado
                </button>

                {categoriesForActiveType.map((c) => {
                  const id = c.id
                  if (!id) return null
                  const isSelected = filterCategoryId === id

                  return (
                    <button
                      key={id}
                      className={`w-full cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${isSelected ? 'bg-white text-forest' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      type="button"
                      onClick={() => setFilterCategoryId(id)}
                    >
                      {categoryNameById.get(id) ?? c.name ?? 'Categoria'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main
        ref={(node) => {
          scrollContainerRef.current = node
        }}
        className="flex-1 overflow-y-auto pb-48"
      >
        <div className="p-6">
          <nav className="sticky top-0 z-20 -mx-6 mb-4 bg-offwhite/90 px-6 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white"
                onClick={() => navigate('/lists')}
                aria-label="Voltar"
              >
                <i className="ri-arrow-left-line text-xl text-sage-dark" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold text-forest">
                  {currentList?.name ?? 'Lista'}
                </div>
                <div className="text-xs text-charcoal/60">{itemCountLabel}</div>
              </div>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 text-sage-dark hover:bg-white"
                aria-label="Opções"
                onClick={() => setIsListOptionsOpen(true)}
              >
                <i className="ri-more-2-fill text-2xl leading-none" />
              </button>
            </div>
          </nav>

          <div className="mb-6 hidden items-center justify-between md:flex">
            <div className="min-w-0">
              <div className="truncate text-2xl font-bold text-charcoal">{currentList?.name ?? 'Lista'}</div>
              <div className="text-sm text-charcoal/60">{itemCountLabel}</div>
            </div>

            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-forest shadow-sm hover:bg-sand-light"
              aria-label="Opções"
              onClick={() => setIsListOptionsOpen(true)}
            >
              <i className="ri-more-2-fill text-2xl leading-none" />
            </button>
          </div>

          {showCategories ? (
            <div className="space-y-4">
              {groupedSections.map((section) => {
                const isCollapsed = collapsedCategoryKeys.has(section.key)

                return (
                  <div key={section.key} className="space-y-3">
                    <button
                      type="button"
                      ref={(node) => {
                        sectionHeaderRefs.current[section.key] = node
                      }}
                      className={`flex w-full items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-left shadow-sm transition-colors ${dragState?.targetKey === section.key ? 'ring-2 ring-amber/40 bg-amber/5' : ''}`}
                      onClick={() => toggleSectionCollapsed(section.key)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="truncate text-lg font-semibold text-charcoal">{section.label}</div>
                        <div className="text-sm text-charcoal/60">{section.items.length}</div>
                      </div>
                      <i
                        className={`ri-arrow-down-s-line text-2xl text-charcoal/40 transition-transform ${isCollapsed ? '' : 'rotate-180'
                          }`}
                      />
                    </button>

                    {!isCollapsed ? (
                      <div className="space-y-3">
                        {section.items.map((item, idx) =>
                          renderItemRow(item, item.id ?? `${section.key}-${idx}`, {
                            showCategoryChip: false,
                            sectionKey: section.key,
                          }),
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {groupedSections.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm text-charcoal/70">Sem itens.</div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleItems.map((item, idx) => renderItemRow(item, item.id ?? `${idx}`, { showCategoryChip: true }))}

              {visibleItems.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm text-charcoal/70">Sem itens.</div>
              ) : null}
            </div>
          )}
        </div>
      </main>
      {dragState ? (
        <div
          className="pointer-events-none fixed z-50 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/5"
          style={{
            left: dragState.x - dragState.offsetX,
            top: dragState.y - dragState.offsetY,
            width: dragState.width,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-gray-300 text-charcoal/40">
              <i className="ri-drag-move-2-line text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-medium text-charcoal">{dragState.itemName}</div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        className='place-items-center h-12 w-12 rounded-full bg-amber fixed bottom-20 right-20'
        onClick={() => setIsAddBottomSheetOpen(true)}>
        <i className="ri-add-large-fill"></i>
      </button>

      {isAddBottomSheetOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/10"
            aria-label="Fechar"
            onClick={() => setIsAddBottomSheetOpen(false)}
          />

          <AddBottomSheet
            value={newItemName}
            onValueChange={setNewItemName}
            onSubmit={() => addItemMutation.mutate()}
            canSubmit={canSubmit}
            isSubmitting={addItemMutation.isPending}
            inputRef={addInputRef}
            onCategoryPress={() => {
              setCategoryPickerTarget('create')
              setIsCategoryPickerOpen(true)
            }}
            onAssigneePress={() => {
              setAssigneePickerTarget('create')
              setIsAssigneePickerOpen(true)
            }}
            onImagePress={() => openPhotoPicker('create')}
            onNotePress={() => setIsNoteOpen((v) => !v)}
            onMorePress={() => {
              openCreateDetails()
            }}
            summary={{
              categoryLabel: selectedCategoryLabel,
              assigneeLabel: selectedAssigneeLabel,
              hasPhoto: Boolean(photoFile),
              hasNote: Boolean(note.trim()),
            }}
            expandedContent={
              isNoteOpen ? (
                <textarea
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-white/60 px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest"
                  rows={3}
                  placeholder="Adicionar uma nota..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              ) : null
            }
          />
        </>
      ) : null}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          if (photoPickerTarget === 'edit') setEditPhotoFile(f)
          else setPhotoFile(f)
          e.target.value = ''
        }}
      />

      {isCategoryPickerOpen ? (
        <BottomSheetPicker
          title="Categoria"
          options={categoryOptions}
          selectedId={categoryPickerTarget === 'edit' ? editCategoryId : selectedCategoryId}
          clearLabel="Não classificado"
          onSelect={(id) => {
            if (categoryPickerTarget === 'edit') setEditCategoryId(id)
            else setSelectedCategoryId(id)
          }}
          onClose={() => setIsCategoryPickerOpen(false)}
        />
      ) : null}

      {isAssigneePickerOpen ? (
        <BottomSheetPicker
          title="Atribuir a"
          options={memberOptions}
          selectedId={assigneePickerTarget === 'edit' ? editAssigneeUserId : assigneeUserId}
          clearLabel="Não atribuir"
          onSelect={(id) => {
            if (assigneePickerTarget === 'edit') setEditAssigneeUserId(id)
            else setAssigneeUserId(id)
          }}
          onClose={() => setIsAssigneePickerOpen(false)}
          isLoading={familyMembersQuery.isLoading}
        />
      ) : null}

      {detailsState ? (
        <ItemDetails
          isCompleted={isCompleted}
          title={detailsState.kind === 'edit' ? 'Editar' : 'Adicionar'}
          name={detailsState.kind === 'edit' ? editItemName : newItemName}
          onNameChange={detailsState.kind === 'edit' ? setEditItemName : setNewItemName}
          canSave={detailsState.kind === 'edit' ? canSaveEdit : canSubmit}
          isSaving={detailsState.kind === 'edit' ? updateItemMutation.isPending : addItemMutation.isPending}
          onSave={() => {
            if (detailsState.kind === 'edit') {
              updateItemMutation.mutate({ itemId: detailsState.itemId })
              return
            }

            addItemMutation.mutate()
          }}
          onClose={closeDetails}
          categoryLabel={detailsState.kind === 'edit' ? editCategoryLabel : selectedCategoryLabel}
          onCategoryPress={() => {
            setCategoryPickerTarget(detailsState.kind)
            setIsCategoryPickerOpen(true)
          }}
          assigneeLabel={detailsState.kind === 'edit' ? editAssigneeLabel : selectedAssigneeLabel}
          onAssigneePress={() => {
            setAssigneePickerTarget(detailsState.kind)
            setIsAssigneePickerOpen(true)
          }}
          hasPhoto={detailsState.kind === 'edit' ? Boolean(editPhotoFile || editPhotoUrl) : Boolean(photoFile)}
          onPhotoPress={() => openPhotoPicker(detailsState.kind)}
          photoPreviewUrl={
            detailsState.kind === 'edit' ? (editPhotoPreviewUrl ?? editPhotoUrl) : photoPreviewUrl
          }
          note={detailsState.kind === 'edit' ? editNote : note}
          isNoteOpen={isDetailsNoteOpen}
          onNotePress={() => setIsDetailsNoteOpen(true)}
          onNoteChange={detailsState.kind === 'edit' ? setEditNote : setNote}
        />
      ) : null}

      {isListOptionsOpen ? (
        <ActionSheet title="Opções de lista" items={listOptionsItems} onClose={() => setIsListOptionsOpen(false)} />
      ) : null}

      {isEditListOpen ? (
        <EditListSheet
          name={editListName}
          onNameChange={setEditListName}
          typeLabel={editListType}
          onTypePress={() => setIsEditListTypePickerOpen(true)}
          colorHex={editListColorHex}
          onColorHexChange={setEditListColorHex}
          canSave={Boolean(currentList?.id) && editListName.trim().length > 0}
          isSaving={updateListMutation.isPending}
          onSave={() => updateListMutation.mutate()}
          onClose={() => {
            setIsEditListOpen(false)
            setIsEditListTypePickerOpen(false)
          }}
        />
      ) : null}

      {isEditListTypePickerOpen ? (
        <BottomSheetPicker
          title="Tipo"
          options={[
            { id: 'Shopping', label: 'Shopping' },
            { id: 'Tasks', label: 'Tasks' },
            { id: 'Custom', label: 'Custom' },
          ]}
          selectedId={editListType}
          onSelect={(id) => setEditListType((id ?? 'Custom') as ListType)}
          onClose={() => setIsEditListTypePickerOpen(false)}
        />
      ) : null}

      {isManageCategoriesOpen ? (
        <ManageCategoriesSheet
          categories={orderedCategories}
          initialType={activeListType}
          isBusy={
            createCategoryMutation.isPending ||
            updateCategoryMutation.isPending ||
            deleteCategoryMutation.isPending ||
            reorderCategoriesMutation.isPending
          }
          errorMessage={categoriesErrorMessage}
          onCreate={(input) => createCategoryMutation.mutate(input)}
          onUpdate={(categoryId, patch) => updateCategoryMutation.mutate({ categoryId, patch })}
          onReorder={(updates) => reorderCategoriesMutation.mutate({ updates })}
          onDelete={(categoryId) => deleteCategoryMutation.mutate({ categoryId })}
          onClose={() => setIsManageCategoriesOpen(false)}
        />
      ) : null}

      {isFilterPickerOpen ? (
        <BottomSheetPicker
          title="Filtrar"
          options={filterPickerOptions}
          selectedId={filterCategoryId}
          clearLabel="Todos os itens"
          onSelect={setFilterCategoryId}
          onClose={() => setIsFilterPickerOpen(false)}
        />
      ) : null}

      {isSortPickerOpen ? (
        <BottomSheetPicker
          title="Classificar"
          options={sortPickerOptions}
          selectedId={sortMode}
          onSelect={(id) => setSortMode((id ?? 'default') as SortMode)}
          onClose={() => setIsSortPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}
