using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public sealed class FinanceAccount : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public FinanceAccountType Type { get; set; } = FinanceAccountType.Checking;

    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "credit-card";
    public int SortOrder { get; set; } = 0;
}

