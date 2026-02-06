namespace DomusUnify.Application.Calendar.Models;

public sealed record UpdateFamilyCalendarSettingsModel(
    string? CalendarColorHex,
    string? HolidaysCountryCode,
    bool? DailyReminderEnabled,
    int? CleanupOlderThanMonths,
    int? CleanupOlderThanYears
);
