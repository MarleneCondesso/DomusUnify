namespace DomusUnify.Api.DTOs.Budgets;

public sealed class BudgetCategoryLimitRequest
{
    public Guid CategoryId { get; set; }
    public decimal Amount { get; set; }
}

