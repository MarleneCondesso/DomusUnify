namespace DomusUnify.Api.DTOs.Budgets;

public sealed class BudgetSummaryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string CurrencyCode { get; set; } = null!;
    public string VisibilityMode { get; set; } = null!;
}

