/**
 * Funções tipadas para consumir a DomusUnify API.
 *
 * Onde entram os tipos?
 * - Os tipos vêm do ficheiro gerado em `src/api/schema.ts`.
 * - Esse ficheiro é gerado a partir do OpenAPI: `../docs/api/openapi.json`
 *
 * Comandos:
 * - `npm run gen:api`
 */

import type { components } from './schema'
import { apiRequest } from './http'

// Tipos (DTOs) extraídos do OpenAPI gerado.
export type LoginRequest = components['schemas']['LoginRequest']
export type RegisterRequest = components['schemas']['RegisterRequest']
export type ExternalLoginRequest = components['schemas']['ExternalLoginRequest']
export type AuthResponse = components['schemas']['AuthResponse']

export type CreateFamilyRequest = components['schemas']['CreateFamilyRequest']
export type SetCurrentFamilyRequest = components['schemas']['SetCurrentFamilyRequest']
export type FamilyResponse = components['schemas']['FamilyResponse']
export type FamilyMembers = components['schemas']['FamilyMemberResponse']

export type CreateListRequest = components['schemas']['CreateListRequest']
export type ListResponse = components['schemas']['ListResponse']
export type RegenerateCoversResponse = { updatedCount: number }
export type CreateListItemRequest = components['schemas']['CreateListItemRequest']
export type UpdateListItemRequest = Omit<
  components['schemas']['UpdateListItemRequest'],
  'categoryId' | 'assigneeUserId' | 'note' | 'photoUrl'
> & {
  categoryId?: string | null
  assigneeUserId?: string | null
  note?: string | null
  photoUrl?: string | null
}
export type ListItemResponse = components['schemas']['ListItemResponse']
export type CategoryListType = 'Shopping' | 'Tasks' | 'Custom'
export type CategoryResponse = components['schemas']['CategoryResponse'] & { type?: CategoryListType }
export type CreateCategoryRequest = components['schemas']['CreateCategoryRequest'] & { type: CategoryListType }
export type UpdateCategoryRequest = components['schemas']['UpdateCategoryRequest'] & { type?: CategoryListType }
export type UpdateListRequest = components['schemas']['UpdateListRequest']

export type CalendarResponse = components['schemas']['CalendarEventResponse']
export type CalendarEventDetailResponse = components['schemas']['CalendarEventDetailResponse']
export type CreateCalendarEventRequest = components['schemas']['CreateCalendarEventRequest']

export type ActivityEntryResponse = components['schemas']['ActivityEntryResponse']
export type ActivityTypeFilter = 'lists' | 'budget' | 'calendar'
export type ActivityQuery = {
  skip?: number
  take?: number
  type?: ActivityTypeFilter
  fromUtc?: string
  toUtc?: string
  dateUtc?: string
}

export type BudgetSummaryResponse = components['schemas']['BudgetSummaryResponse']
export type BudgetDetailResponse = components['schemas']['BudgetDetailResponse']
export type BudgetTotalsResponse = components['schemas']['BudgetTotalsResponse']

/**
 * Nota: as rotas aqui seguem exatamente o que está no backend.
 * Ex.: `src/DomusUnify.Api/Controllers/AuthController.cs`
 */
export const domusApi = {
  // Auth
  register: async (request: RegisterRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/api/v1/auth/register', { method: 'POST', json: request }),

  login: async (request: LoginRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/api/v1/auth/login', { method: 'POST', json: request }),

  loginWithGoogle: async (request: ExternalLoginRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/api/v1/auth/oauth/google', { method: 'POST', json: request }),

  // Famílias
  getMyFamily: async (token: string): Promise<FamilyResponse> =>
    apiRequest<FamilyResponse>('/api/v1/families/me', { token }),

  getMyFamilies: async (token: string): Promise<FamilyResponse[]> =>
    apiRequest<FamilyResponse[]>('/api/v1/families/my', { token }),

  createFamily: async (token: string, request: CreateFamilyRequest): Promise<FamilyResponse> =>
    apiRequest<FamilyResponse>('/api/v1/families', { method: 'POST', token, json: request }),

  setCurrentFamily: async (token: string, request: SetCurrentFamilyRequest): Promise<void> =>
    apiRequest<void>('/api/v1/families/set-current', { method: 'POST', token, json: request }),
  
  getFamilyMembers: async (token: string): Promise<FamilyMembers[]> =>
    apiRequest<FamilyMembers[]>('/api/v1/families/members', { token }),
  // Listas
  getLists: async (token: string): Promise<ListResponse[]> =>
    apiRequest<ListResponse[]>('/api/v1/lists', { token }),

  createList: async (token: string, request: CreateListRequest): Promise<ListResponse> =>
    apiRequest<ListResponse>('/api/v1/lists', { method: 'POST', token, json: request }),

  regenerateListCovers: async (token: string): Promise<RegenerateCoversResponse> =>
    apiRequest<RegenerateCoversResponse>('/api/v1/lists/regenerate-covers', { method: 'POST', token }),

  getListCategories: async (token: string): Promise<CategoryResponse[]> =>
    apiRequest<CategoryResponse[]>('/api/v1/item-categories', { token }),

  getItemCategories: async (token: string): Promise<CategoryResponse[]> =>
    apiRequest<CategoryResponse[]>('/api/v1/item-categories', { token }),

  createItemCategory: async (token: string, request: CreateCategoryRequest): Promise<CategoryResponse> =>
    apiRequest<CategoryResponse>('/api/v1/item-categories', { method: 'POST', token, json: request }),

  updateItemCategory: async (token: string, categoryId: string, request: UpdateCategoryRequest): Promise<CategoryResponse> =>
    apiRequest<CategoryResponse>(`/api/v1/item-categories/${categoryId}`, { method: 'PATCH', token, json: request }),

  deleteItemCategory: async (token: string, categoryId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/item-categories/${categoryId}`, { method: 'DELETE', token }),

  updateList: async (token: string, listId: string, request: UpdateListRequest): Promise<void> =>
    apiRequest<void>(`/api/v1/lists/${listId}`, { method: 'PATCH', token, json: request }),

  deleteList: async (token: string, listId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/lists/${listId}`, { method: 'DELETE', token }),

  getListItems: async (token: string, listId: string): Promise<ListItemResponse[]> =>
    apiRequest<ListItemResponse[]>(`/api/v1/lists/${listId}/items`, { token }),

  addListItem: async (token: string, listId: string, request: CreateListItemRequest): Promise<ListItemResponse> =>
    apiRequest<ListItemResponse>(`/api/v1/lists/${listId}/items`, { method: 'POST', token, json: request }),

  updateListItem: async (token: string, itemId: string, request: UpdateListItemRequest): Promise<void> =>
    apiRequest<void>(`/api/v1/lists/items/${itemId}`, { method: 'PATCH', token, json: request }),

  //Calendar
  getCalendarEvents: async (token: string, fromUtc?: string, toUtc?: string, dateUtc?: string, search?: string, participantUserId?: string, take?: number): Promise<CalendarResponse[]> => {
    const searchParams = new URLSearchParams()
    if (fromUtc) searchParams.set('fromUtc', fromUtc)
    if (toUtc) searchParams.set('toUtc', toUtc)
    if (dateUtc) searchParams.set('dateUtc', dateUtc)
    if (search) searchParams.set('search', search)
    if (participantUserId) searchParams.set('participantUserId', participantUserId)
    if (take !== undefined) searchParams.set('take', String(take))

    return apiRequest<CalendarResponse[]>(`/api/v1/calendar/events?${searchParams.toString()}`, { token })
  },

  createCalendarEvent: async (token: string, request: CreateCalendarEventRequest): Promise<CalendarResponse> =>
    apiRequest<CalendarResponse>('/api/v1/calendar/events', { method: 'POST', token, json: request }),

  deleteCalendarEvent: async (token: string, eventId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/calendar/events/${eventId}`, { method: 'DELETE', token }),

  // Budgets
  getBudgets: async (token: string): Promise<BudgetSummaryResponse[]> =>
    apiRequest<BudgetSummaryResponse[]>('/api/v1/budgets', { token }),

  getBudgetById: async (token: string, budgetId: string): Promise<BudgetDetailResponse> =>
    apiRequest<BudgetDetailResponse>(`/api/v1/budgets/${budgetId}`, { token }),

  getBudgetTotals: async (token: string, budgetId: string, referenceDate?: string): Promise<BudgetTotalsResponse> => {
    const searchParams = new URLSearchParams()
    if (referenceDate) searchParams.set('referenceDate', referenceDate)

    const qs = searchParams.toString()
    return apiRequest<BudgetTotalsResponse>(
      `/api/v1/budgets/${budgetId}/transactions/totals${qs ? `?${qs}` : ''}`,
      { token },
    )
  },


  // Activity (Recent Updates / All Activity)
  getRecentActivity: async (token: string, take = 4): Promise<ActivityEntryResponse[]> =>
    apiRequest<ActivityEntryResponse[]>(`/api/v1/activity/recent?take=${take}`, { token }),

  getActivity: async (token: string, query: ActivityQuery = {}): Promise<ActivityEntryResponse[]> => {
    const skip = query.skip ?? 0
    const take = query.take ?? 50

    const search = new URLSearchParams()
    search.set('skip', String(skip))
    search.set('take', String(take))
    if (query.type) search.set('type', query.type)
    if (query.fromUtc) search.set('fromUtc', query.fromUtc)
    if (query.toUtc) search.set('toUtc', query.toUtc)
    if (query.dateUtc) search.set('dateUtc', query.dateUtc)

    return apiRequest<ActivityEntryResponse[]>(`/api/v1/activity?${search.toString()}`, { token })
  },

  // Notifications (Unread)
  getUnreadNotifications: async (token: string, take = 50): Promise<ActivityEntryResponse[]> =>
    apiRequest<ActivityEntryResponse[]>(`/api/v1/notifications/unread?take=${take}`, { token }),

  markAllNotificationsSeen: async (token: string): Promise<void> =>
    apiRequest<void>('/api/v1/notifications/mark-all-seen', { method: 'POST', token }),
}
