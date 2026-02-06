using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Calendar.Models;

public sealed record UpdateUserCalendarSettingsModel(
    TimeOnly? DailyReminderTime,
    DailyReminderMode? DailyReminderMode,
    int? DefaultEventReminderMinutes
);
