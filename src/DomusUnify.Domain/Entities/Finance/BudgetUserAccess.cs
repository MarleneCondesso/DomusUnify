namespace DomusUnify.Domain.Entities;

public sealed class BudgetUserAccess
{
    public Guid Id { get; set; }

    public Guid BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; }
}

