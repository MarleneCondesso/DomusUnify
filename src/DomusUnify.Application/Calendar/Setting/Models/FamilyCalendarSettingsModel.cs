namespace DomusUnify.Application.Calendar.Models;

public sealed record FamilyCalendarSettingsModel(
    string? CalendarColorHex,
    string HolidaysCountryCode,
    bool DailyReminderEnabled,
    int? CleanupOlderThanMonths,
    int? CleanupOlderThanYears
);
