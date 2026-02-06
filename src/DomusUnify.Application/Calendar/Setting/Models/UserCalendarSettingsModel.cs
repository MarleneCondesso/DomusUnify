using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Calendar.Models;

public sealed record UserCalendarSettingsModel(
    TimeOnly DailyReminderTime,
    DailyReminderMode DailyReminderMode,
    int? DefaultEventReminderMinutes
);
