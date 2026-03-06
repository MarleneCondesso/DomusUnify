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
import { apiDownload, apiRequest, type ApiDownloadResult } from './http'

// Tipos (DTOs) extraídos do OpenAPI gerado.
export type LoginRequest = components['schemas']['LoginRequest']
export type RegisterRequest = components['schemas']['RegisterRequest']
export type ExternalLoginRequest = components['schemas']['ExternalLoginRequest']
export type AuthResponse = components['schemas']['AuthResponse']

export type CreateFamilyRequest = components['schemas']['CreateFamilyRequest']
export type SetCurrentFamilyRequest = components['schemas']['SetCurrentFamilyRequest']
export type FamilyResponse = components['schemas']['FamilyResponse']
export type FamilyMembers = components['schemas']['FamilyMemberResponse']
export type FamilyMemberProfileResponse = components['schemas']['FamilyMemberProfileResponse']
export type CreateInviteResult = components['schemas']['CreateInviteResult']
export type InvitePreviewModel = components['schemas']['InvitePreviewModel']
export type JoinInviteRequest = components['schemas']['JoinInviteRequest']

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
export type UpdateCalendarEventRequest = components['schemas']['UpdateCalendarEventRequest']

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
export type BudgetMemberResponse = components['schemas']['BudgetMemberResponse']
export type CreateBudgetRequest = components['schemas']['CreateBudgetRequest']
export type UpdateBudgetRequest = components['schemas']['UpdateBudgetRequest']

export type FinanceTransactionResponse = components['schemas']['FinanceTransactionResponse']
export type CreateFinanceTransactionRequest = components['schemas']['CreateFinanceTransactionRequest']
export type UpdateFinanceTransactionRequest = components['schemas']['UpdateFinanceTransactionRequest']
export type FinanceAccountResponse = components['schemas']['FinanceAccountResponse']
export type CreateFinanceAccountRequest = components['schemas']['CreateFinanceAccountRequest']
export type FinanceCategoryResponse = components['schemas']['FinanceCategoryResponse']
export type CreateFinanceCategoryRequest = components['schemas']['CreateFinanceCategoryRequest']
export type UpdateFinanceCategoryRequest = components['schemas']['UpdateFinanceCategoryRequest']
export type CategorySummaryResponse = components['schemas']['CategorySummaryResponse']
export type MemberSummaryResponse = components['schemas']['MemberSummaryResponse']
export type AccountSummaryResponse = components['schemas']['AccountSummaryResponse']

export type UserProfileResponse = components['schemas']['UserProfileResponse']
export type UpdateUserProfileRequest = components['schemas']['UpdateUserProfileRequest']
export type PushPublicKeyResponse = { publicKey: string }
export type UpsertWebPushSubscriptionRequest = {
  endpoint: string
  p256Dh: string
  auth: string
  notificationsEnabled: boolean
  listsEnabled: boolean
  budgetEnabled: boolean
  calendarEnabled: boolean
  userAgent?: string
}

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

  getFamilyById: async (token: string, familyId: string): Promise<FamilyResponse> =>
    apiRequest<FamilyResponse>(`/api/v1/families/${familyId}`, { token }),

  getFamilyMembersByFamilyId: async (token: string, familyId: string): Promise<FamilyMembers[]> =>
    apiRequest<FamilyMembers[]>(`/api/v1/families/${familyId}/members`, { token }),

  getFamilyMemberProfile: async (token: string, familyId: string, userId: string): Promise<FamilyMemberProfileResponse> =>
    apiRequest<FamilyMemberProfileResponse>(`/api/v1/families/${familyId}/members/${userId}/profile`, { token }),

  getFamilyActivityRecent: async (token: string, familyId: string, take = 4): Promise<ActivityEntryResponse[]> =>
    apiRequest<ActivityEntryResponse[]>(`/api/v1/families/${familyId}/activity/recent?take=${take}`, { token }),

  getFamilyActivity: async (token: string, familyId: string, query: ActivityQuery = {}): Promise<ActivityEntryResponse[]> => {
    const skip = query.skip ?? 0
    const take = query.take ?? 50

    const search = new URLSearchParams()
    search.set('skip', String(skip))
    search.set('take', String(take))
    if (query.type) search.set('type', query.type)
    if (query.fromUtc) search.set('fromUtc', query.fromUtc)
    if (query.toUtc) search.set('toUtc', query.toUtc)
    if (query.dateUtc) search.set('dateUtc', query.dateUtc)

    return apiRequest<ActivityEntryResponse[]>(`/api/v1/families/${familyId}/activity?${search.toString()}`, { token })
  },

  makeFamilyMemberAdmin: async (token: string, familyId: string, userId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/families/${familyId}/members/${userId}/make-admin`, { method: 'POST', token }),

  removeFamilyMember: async (token: string, familyId: string, userId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/families/${familyId}/members/${userId}`, { method: 'DELETE', token }),

  deleteFamily: async (token: string, familyId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/families/${familyId}`, { method: 'DELETE', token }),

  createFamilyInvite: async (
    token: string,
    familyId: string,
    params: { daysValid?: number; maxUses?: number } = {},
  ): Promise<CreateInviteResult> => {
    const searchParams = new URLSearchParams()
    if (typeof params.daysValid === 'number') searchParams.set('daysValid', String(params.daysValid))
    if (typeof params.maxUses === 'number') searchParams.set('maxUses', String(params.maxUses))
    const qs = searchParams.toString()

    return apiRequest<CreateInviteResult>(`/api/v1/families/${familyId}/invites${qs ? `?${qs}` : ''}`, { method: 'POST', token })
  },

  previewFamilyInvite: async (token: string, inviteToken: string): Promise<InvitePreviewModel> => {
    const qs = new URLSearchParams({ token: inviteToken }).toString()
    return apiRequest<InvitePreviewModel>(`/api/v1/families/invites/preview?${qs}`, { token })
  },

  joinFamilyInvite: async (token: string, inviteToken: string): Promise<void> =>
    apiRequest<void>('/api/v1/families/invites/join', { method: 'POST', token, json: { token: inviteToken } satisfies JoinInviteRequest }),

  // Utilizador
  getMyProfile: async (token: string): Promise<UserProfileResponse> =>
    apiRequest<UserProfileResponse>('/api/v1/users/me/profile', { token }),

  updateMyProfile: async (token: string, request: UpdateUserProfileRequest): Promise<UserProfileResponse> =>
    apiRequest<UserProfileResponse>('/api/v1/users/me/profile', { method: 'PUT', token, json: request }),

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

  deleteListItem: async (token: string, itemId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/lists/items/${itemId}`, { method: 'DELETE', token }),

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

  updateCalendarEvent: async (token: string, eventId: string, request: UpdateCalendarEventRequest): Promise<CalendarResponse> =>
    apiRequest<CalendarResponse>(`/api/v1/calendar/events/${eventId}`, { method: 'PATCH', token, json: request }),

  deleteCalendarEvent: async (token: string, eventId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/calendar/events/${eventId}`, { method: 'DELETE', token }),

  // Budgets
  getBudgets: async (token: string): Promise<BudgetSummaryResponse[]> =>
    apiRequest<BudgetSummaryResponse[]>('/api/v1/budgets', { token }),

  createBudget: async (token: string, request: CreateBudgetRequest): Promise<BudgetDetailResponse> =>
    apiRequest<BudgetDetailResponse>('/api/v1/budgets', { method: 'POST', token, json: request }),

  getBudgetById: async (token: string, budgetId: string): Promise<BudgetDetailResponse> =>
    apiRequest<BudgetDetailResponse>(`/api/v1/budgets/${budgetId}`, { token }),

  updateBudget: async (token: string, budgetId: string, request: UpdateBudgetRequest): Promise<BudgetDetailResponse> =>
    apiRequest<BudgetDetailResponse>(`/api/v1/budgets/${budgetId}`, { method: 'PATCH', token, json: request }),

  getBudgetMembers: async (token: string, budgetId: string): Promise<BudgetMemberResponse[]> =>
    apiRequest<BudgetMemberResponse[]>(`/api/v1/budgets/${budgetId}/members`, { token }),

  getBudgetTotals: async (token: string, budgetId: string, referenceDate?: string): Promise<BudgetTotalsResponse> => {
    const searchParams = new URLSearchParams()
    if (referenceDate) searchParams.set('referenceDate', referenceDate)

    const qs = searchParams.toString()
    return apiRequest<BudgetTotalsResponse>(
      `/api/v1/budgets/${budgetId}/transactions/totals${qs ? `?${qs}` : ''}`,
      { token },
    )
  },

  getBudgetTransactions: async (
    token: string,
    budgetId: string,
    params: { from?: string; to?: string } = {},
  ): Promise<FinanceTransactionResponse[]> => {
    const searchParams = new URLSearchParams()
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)

    const qs = searchParams.toString()
    return apiRequest<FinanceTransactionResponse[]>(
      `/api/v1/budgets/${budgetId}/transactions${qs ? `?${qs}` : ''}`,
      { token },
    )
  },

  exportBudgetTransactionsCsv: async (
    token: string,
    budgetId: string,
    params: { from: string; to: string; delimiter?: string } ,
  ): Promise<ApiDownloadResult> => {
    const searchParams = new URLSearchParams()
    searchParams.set('from', params.from)
    searchParams.set('to', params.to)
    if (params.delimiter) searchParams.set('delimiter', params.delimiter)

    return apiDownload(`/api/v1/budgets/${budgetId}/transactions/export?${searchParams.toString()}`, { token })
  },

  createBudgetTransaction: async (
    token: string,
    budgetId: string,
    request: CreateFinanceTransactionRequest,
  ): Promise<FinanceTransactionResponse> =>
    apiRequest<FinanceTransactionResponse>(`/api/v1/budgets/${budgetId}/transactions`, {
      method: 'POST',
      token,
      json: request,
    }),

  updateBudgetTransaction: async (
    token: string,
    budgetId: string,
    transactionId: string,
    request: UpdateFinanceTransactionRequest,
  ): Promise<FinanceTransactionResponse> =>
    apiRequest<FinanceTransactionResponse>(`/api/v1/budgets/${budgetId}/transactions/${transactionId}`, {
      method: 'PATCH',
      token,
      json: request,
    }),

  deleteBudgetTransaction: async (token: string, budgetId: string, transactionId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/budgets/${budgetId}/transactions/${transactionId}`, { method: 'DELETE', token }),

  getBudgetSummaryByCategories: async (
    token: string,
    budgetId: string,
    params: { type?: string; from?: string; to?: string } = {},
  ): Promise<CategorySummaryResponse[]> => {
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.set('type', params.type)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)

    const qs = searchParams.toString()
    return apiRequest<CategorySummaryResponse[]>(
      `/api/v1/budgets/${budgetId}/transactions/summary/categories${qs ? `?${qs}` : ''}`,
      { token },
    )
  },

  getBudgetSummaryByMembers: async (
    token: string,
    budgetId: string,
    params: { type?: string; from?: string; to?: string } = {},
  ): Promise<MemberSummaryResponse[]> => {
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.set('type', params.type)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)

    const qs = searchParams.toString()
    return apiRequest<MemberSummaryResponse[]>(
      `/api/v1/budgets/${budgetId}/transactions/summary/members${qs ? `?${qs}` : ''}`,
      { token },
    )
  },

  getBudgetSummaryByAccounts: async (
    token: string,
    budgetId: string,
    params: { type?: string; from?: string; to?: string } = {},
  ): Promise<AccountSummaryResponse[]> => {
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.set('type', params.type)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)

    const qs = searchParams.toString()
    return apiRequest<AccountSummaryResponse[]>(
      `/api/v1/budgets/${budgetId}/transactions/summary/accounts${qs ? `?${qs}` : ''}`,
      { token },
    )
  },

  markAllBudgetTransactionsPaid: async (token: string, budgetId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/budgets/${budgetId}/transactions/mark-all-paid`, { method: 'POST', token }),

  clearBudgetTransactions: async (token: string, budgetId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/budgets/${budgetId}/transactions/clear`, { method: 'POST', token }),

  // Budget (Accounts visibility)
  getBudgetVisibleAccounts: async (token: string, budgetId: string): Promise<FinanceAccountResponse[]> =>
    apiRequest<FinanceAccountResponse[]>(`/api/v1/budgets/${budgetId}/accounts`, { token }),

  getBudgetHiddenAccounts: async (token: string, budgetId: string): Promise<FinanceAccountResponse[]> =>
    apiRequest<FinanceAccountResponse[]>(`/api/v1/budgets/${budgetId}/accounts/hidden`, { token }),

  hideBudgetAccount: async (token: string, budgetId: string, accountId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/budgets/${budgetId}/accounts/hidden/${accountId}`, { method: 'PUT', token }),

  unhideBudgetAccount: async (token: string, budgetId: string, accountId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/budgets/${budgetId}/accounts/hidden/${accountId}`, { method: 'DELETE', token }),

  // Finance (Categories, Accounts)
  getFinanceAccounts: async (token: string): Promise<FinanceAccountResponse[]> =>
    apiRequest<FinanceAccountResponse[]>('/api/v1/finance-accounts', { token }),

  createFinanceAccount: async (token: string, request: CreateFinanceAccountRequest): Promise<FinanceAccountResponse> =>
    apiRequest<FinanceAccountResponse>('/api/v1/finance-accounts', { method: 'POST', token, json: request }),

  deleteFinanceAccount: async (token: string, accountId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/finance-accounts/${accountId}`, { method: 'DELETE', token }),

  getFinanceCategories: async (token: string, type?: string): Promise<FinanceCategoryResponse[]> => {
    const searchParams = new URLSearchParams()
    if (type) searchParams.set('type', type)
    const qs = searchParams.toString()

    return apiRequest<FinanceCategoryResponse[]>(`/api/v1/finance-categories${qs ? `?${qs}` : ''}`, { token })
  },

  createFinanceCategory: async (token: string, request: CreateFinanceCategoryRequest): Promise<FinanceCategoryResponse> =>
    apiRequest<FinanceCategoryResponse>('/api/v1/finance-categories', { method: 'POST', token, json: request }),

  updateFinanceCategory: async (
    token: string,
    categoryId: string,
    request: UpdateFinanceCategoryRequest,
  ): Promise<FinanceCategoryResponse> =>
    apiRequest<FinanceCategoryResponse>(`/api/v1/finance-categories/${categoryId}`, { method: 'PATCH', token, json: request }),

  deleteFinanceCategory: async (token: string, categoryId: string): Promise<void> =>
    apiRequest<void>(`/api/v1/finance-categories/${categoryId}`, { method: 'DELETE', token }),


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

  // Web Push
  getPushPublicKey: async (token: string): Promise<PushPublicKeyResponse> =>
    apiRequest<PushPublicKeyResponse>('/api/v1/push/public-key', { token }),

  upsertPushSubscription: async (token: string, request: UpsertWebPushSubscriptionRequest): Promise<void> =>
    apiRequest<void>('/api/v1/push/subscriptions', { method: 'PUT', token, json: request }),

  deletePushSubscription: async (token: string, endpoint: string): Promise<void> =>
    apiRequest<void>(`/api/v1/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE', token }),
}
