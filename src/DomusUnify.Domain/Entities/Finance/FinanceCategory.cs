using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public sealed class FinanceCategory : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public FinanceCategoryType Type { get; set; } = FinanceCategoryType.Expense;

    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "tag";
    public int SortOrder { get; set; } = 0;
}

