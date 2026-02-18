using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo de atualização (parcial) das definições de calendário ao nível do utilizador.
/// </summary>
/// <param name="DailyReminderTime">Nova hora do lembrete diário (opcional).</param>
/// <param name="DailyReminderMode">Novo modo do lembrete diário (opcional).</param>
/// <param name="DefaultEventReminderMinutes">Novo lembrete por defeito para eventos, em minutos (opcional).</param>
public sealed record UpdateUserCalendarSettingsModel(
    TimeOnly? DailyReminderTime,
    DailyReminderMode? DailyReminderMode,
    int? DefaultEventReminderMinutes
);
