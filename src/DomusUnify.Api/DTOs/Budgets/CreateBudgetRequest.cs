namespace DomusUnify.Api.DTOs.Budgets;

public sealed class CreateBudgetRequest
{
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "wallet";

    // Recurring | OneTime
    public string Type { get; set; } = "Recurring";

    // Monthly | Weekly | BiWeekly | SemiMonthly | Yearly
    public string? PeriodType { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? SemiMonthlyPattern { get; set; } // FirstAndFifteenth | FifteenthAndLastDay

    public decimal? SpendingLimit { get; set; }
    public string CurrencyCode { get; set; } = "EUR";

    // Private | AllMembers | SpecificMembers
    public string VisibilityMode { get; set; } = "AllMembers";
    public List<Guid>? AllowedUserIds { get; set; }

    // Display settings
    public string? MainIndicator { get; set; } // TotalIncome | TotalExpenses | Balance | BalanceToday
    public bool? OnlyPaidInTotals { get; set; }
    public string? TransactionOrder { get; set; } // MostRecentFirst | OldestFirst
    public string? UpcomingDisplayMode { get; set; } // Expanded | Collapsed

    public List<BudgetCategoryLimitRequest>? CategoryLimits { get; set; }
}

