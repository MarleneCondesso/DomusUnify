using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public sealed class UserCalendarSettings : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Lembrete diário
    public TimeOnly DailyReminderTime { get; set; } = new(9, 0); // default 09:00
    public DailyReminderMode DailyReminderMode { get; set; } = DailyReminderMode.SameDay;

    // Lembrete padrão para eventos
    public int? DefaultEventReminderMinutes { get; set; } // ex: 10, 30, 60
}
