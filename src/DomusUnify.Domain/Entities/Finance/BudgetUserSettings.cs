using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public sealed class BudgetUserSettings : BaseEntity
{
    public Guid BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Notificações
    public bool DailyReminderEnabled { get; set; } = false;
    public TimeOnly DailyReminderTime { get; set; } = new(21, 0); // default 21:00
}

