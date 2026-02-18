namespace DomusUnify.Api.DTOs.Budgets;

public sealed class UpdateBudgetRequest
{
    public string? Name { get; set; }
    public string? IconKey { get; set; }

    public string? PeriodType { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? SemiMonthlyPattern { get; set; }

    public decimal? SpendingLimit { get; set; }
    public bool SpendingLimitChangeRequested { get; set; } = false;

    public string? CurrencyCode { get; set; }

    public string? VisibilityMode { get; set; }
    public List<Guid>? AllowedUserIds { get; set; }

    public string? MainIndicator { get; set; }
    public bool? OnlyPaidInTotals { get; set; }
    public string? TransactionOrder { get; set; }
    public string? UpcomingDisplayMode { get; set; }
}

