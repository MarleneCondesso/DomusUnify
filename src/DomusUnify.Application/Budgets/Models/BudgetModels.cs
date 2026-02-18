using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Budgets.Models;

public sealed record BudgetSummaryModel(
    Guid Id,
    string Name,
    string IconKey,
    string Type,
    string CurrencyCode,
    string VisibilityMode
);

public sealed record BudgetDetailModel(
    Guid Id,
    Guid FamilyId,
    Guid OwnerUserId,
    string Name,
    string IconKey,
    string Type,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    string CurrencyCode,
    string VisibilityMode,
    BudgetMainIndicator MainIndicator,
    bool OnlyPaidInTotals,
    BudgetTransactionOrder TransactionOrder,
    BudgetUpcomingDisplayMode UpcomingDisplayMode,
    IReadOnlyList<Guid> AllowedUserIds
);

public sealed record BudgetMemberModel(
    Guid UserId,
    string Name,
    string Role
);

public sealed record BudgetCategoryLimitModel(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string CategoryIconKey,
    int CategorySortOrder,
    decimal Amount
);

public sealed record BudgetCreateInput(
    string Name,
    string IconKey,
    string Type,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    string CurrencyCode,
    string VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds,
    BudgetMainIndicator? MainIndicator,
    bool? OnlyPaidInTotals,
    BudgetTransactionOrder? TransactionOrder,
    BudgetUpcomingDisplayMode? UpcomingDisplayMode,
    IReadOnlyList<BudgetCategoryLimitInput>? CategoryLimits
);

public sealed record BudgetCategoryLimitInput(Guid CategoryId, decimal Amount);

public sealed record BudgetUpdateInput(
    string? Name,
    string? IconKey,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    bool SpendingLimitChangeRequested,
    string? CurrencyCode,
    string? VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds,
    BudgetMainIndicator? MainIndicator,
    bool? OnlyPaidInTotals,
    BudgetTransactionOrder? TransactionOrder,
    BudgetUpcomingDisplayMode? UpcomingDisplayMode
);
