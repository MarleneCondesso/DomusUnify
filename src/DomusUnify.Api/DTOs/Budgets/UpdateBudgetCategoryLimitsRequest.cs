namespace DomusUnify.Api.DTOs.Budgets;

public sealed class UpdateBudgetCategoryLimitsRequest
{
    public List<BudgetCategoryLimitRequest> Limits { get; set; } = new();
}

