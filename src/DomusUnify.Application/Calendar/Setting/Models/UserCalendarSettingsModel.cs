using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo com definições de calendário ao nível do utilizador.
/// </summary>
/// <param name="DailyReminderTime">Hora do lembrete diário.</param>
/// <param name="DailyReminderMode">Modo do lembrete diário.</param>
/// <param name="DefaultEventReminderMinutes">Lembrete por defeito para eventos, em minutos (opcional).</param>
public sealed record UserCalendarSettingsModel(
    TimeOnly DailyReminderTime,
    DailyReminderMode DailyReminderMode,
    int? DefaultEventReminderMinutes
);
