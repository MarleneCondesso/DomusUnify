namespace DomusUnify.Api.DTOs.Budgets;

public sealed class BudgetDetailResponse
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid OwnerUserId { get; set; }

    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = null!;
    public string Type { get; set; } = null!;

    public string? PeriodType { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? SemiMonthlyPattern { get; set; }

    public decimal? SpendingLimit { get; set; }
    public string CurrencyCode { get; set; } = null!;

    public string VisibilityMode { get; set; } = null!;
    public List<Guid> AllowedUserIds { get; set; } = new();

    public string MainIndicator { get; set; } = null!;
    public bool OnlyPaidInTotals { get; set; }
    public string TransactionOrder { get; set; } = null!;
    public string UpcomingDisplayMode { get; set; } = null!;
}

