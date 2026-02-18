using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public sealed class BudgetCategoryLimit : BaseEntity
{
    public Guid BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public FinanceCategory Category { get; set; } = null!;

    public decimal Amount { get; set; }
}

