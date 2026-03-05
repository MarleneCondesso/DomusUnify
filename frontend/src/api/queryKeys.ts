/**
 * Chaves (keys) usadas pelo TanStack React Query.
 *
 * Porquê isto existe?
 * - O React Query identifica cache por "queryKey".
 * - Ao padronizarmos as keys, fica mais fácil invalidar/refazer queries quando chegam eventos SignalR.
 */

export const queryKeys = {
  familyMe: ['familyMe'] as const,
  familiesMy: ['familiesMy'] as const,
  familyMembers: ['familyMembers'] as const,
  familyById: (familyId: string) => ['familyById', familyId] as const,
  familyMembersByFamilyId: (familyId: string) => ['familyMembersByFamilyId', familyId] as const,
  familyMemberProfile: (params: { familyId: string; userId: string }) => ['familyMemberProfile', params.familyId, params.userId] as const,
  familyActivityRecentByFamilyId: (params: { familyId: string; take: number }) => ['familyActivityRecentByFamilyId', params.familyId, params.take] as const,
  userProfileMe: ['userProfileMe'] as const,
  lists: ['lists'] as const,
  listItems: (listId: string) => ['listItems', listId] as const,
  listItemsCategories: ['listItemsCategories'] as const,
  calendarEvents: (params: {
    fromUtc?: string
    toUtc?: string
    dateUtc?: string
    search?: string
    participantUserId?: string
    take?: number
  }) =>
    [
      'calendarEvents',
      params.fromUtc ?? null,
      params.toUtc ?? null,
      params.dateUtc ?? null,
      params.search ?? null,
      params.participantUserId ?? null,
      params.take ?? null,
    ] as const,
  budgets: ['budgets'] as const,
  budgetById: (budgetId: string) => ['budgetById', budgetId] as const,
  budgetMembers: (budgetId: string) => ['budgetMembers', budgetId] as const,
  budgetTotals: (params: { budgetId: string; referenceDate?: string }) =>
    ['budgetTotals', params.budgetId, params.referenceDate ?? null] as const,
  budgetTransactions: (params: { budgetId: string; from?: string; to?: string }) =>
    ['budgetTransactions', params.budgetId, params.from ?? null, params.to ?? null] as const,
  budgetSummaryCategories: (params: { budgetId: string; type?: string; from?: string; to?: string }) =>
    ['budgetSummaryCategories', params.budgetId, params.type ?? null, params.from ?? null, params.to ?? null] as const,
  budgetSummaryMembers: (params: { budgetId: string; type?: string; from?: string; to?: string }) =>
    ['budgetSummaryMembers', params.budgetId, params.type ?? null, params.from ?? null, params.to ?? null] as const,
  budgetSummaryAccounts: (params: { budgetId: string; type?: string; from?: string; to?: string }) =>
    ['budgetSummaryAccounts', params.budgetId, params.type ?? null, params.from ?? null, params.to ?? null] as const,
  budgetAccountsVisible: (budgetId: string) => ['budgetAccountsVisible', budgetId] as const,
  budgetAccountsHidden: (budgetId: string) => ['budgetAccountsHidden', budgetId] as const,
  financeAccounts: ['financeAccounts'] as const,
  financeCategories: (type?: string) => ['financeCategories', type ?? null] as const,
  activityRecent: (take: number) => ['activityRecent', take] as const,
  activityAll: (params: {
    skip?: number
    take?: number
    type?: string
    fromUtc?: string
    toUtc?: string
    dateUtc?: string
  }) =>
    [
      'activityAll',
      params.skip ?? 0,
      params.take ?? 50,
      params.type ?? null,
      params.fromUtc ?? null,
      params.toUtc ?? null,
      params.dateUtc ?? null,
    ] as const,
  notificationsUnread: ['notificationsUnread'] as const,
}
