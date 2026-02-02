using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public class Expense : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;
    public string? Description { get; set; }
    public DateTime DateUtc { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
