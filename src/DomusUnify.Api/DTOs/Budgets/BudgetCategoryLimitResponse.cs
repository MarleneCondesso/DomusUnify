namespace DomusUnify.Api.DTOs.Budgets;

public sealed class BudgetCategoryLimitResponse
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string CategoryIconKey { get; set; } = null!;
    public int CategorySortOrder { get; set; }
    public decimal Amount { get; set; }
}

