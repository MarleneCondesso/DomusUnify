using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public sealed class FamilyCalendarSettings : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    // UI / visual
    public string? CalendarColorHex { get; set; } // ex: #FFAA00

    // Feriados
    public string HolidaysCountryCode { get; set; } = "PT";

    // Limpeza automática
    public int? CleanupOlderThanMonths { get; set; } // ex: 3, 6, 12
    public int? CleanupOlderThanYears { get; set; }  // ex: 1, 2, 3

    // Lembrete diário global
    public bool DailyReminderEnabled { get; set; }
}
