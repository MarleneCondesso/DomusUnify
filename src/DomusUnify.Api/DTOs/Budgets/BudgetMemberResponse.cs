namespace DomusUnify.Api.DTOs.Budgets;

public sealed class BudgetMemberResponse
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!;
}

